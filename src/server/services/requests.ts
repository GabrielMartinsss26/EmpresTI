import "server-only";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  assertReader,
  equipmentSummary,
  invalidCursor,
  type Reader,
} from "./read-access";
import { page, type PageInput } from "./read-input";

function availabilityConflict(): never {
  throw new TRPCError({
    code: "CONFLICT",
    message: "A disponibilidade mudou. Atualize a lista e tente novamente.",
  });
}

export async function createRequest(
  reader: Reader,
  equipmentId: string,
  clock: () => Date = () => new Date(),
) {
  try {
    return await reader.db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '3s'");
        const memberships = await tx.$queryRaw<{ id: string }[]>`
        SELECT m.id FROM memberships m
        JOIN profiles p ON p.id = m.user_id
        JOIN tenants t ON t.id = m.tenant_id
        WHERE m.id = ${reader.membershipId}::uuid AND m.user_id = ${reader.userId}::uuid
          AND m.tenant_id = ${reader.tenantId}::uuid
          AND m.deactivated_at IS NULL AND p.deactivated_at IS NULL AND t.deactivated_at IS NULL
        FOR UPDATE OF m FOR SHARE OF p, t
      `;
        if (!memberships.length) throw new TRPCError({ code: "FORBIDDEN" });
        const equipment = await tx.$queryRaw<{ operational_status: string }[]>`
        SELECT e.operational_status FROM equipment e
        JOIN equipment_categories c ON c.id = e.category_id AND c.tenant_id = e.tenant_id
        WHERE e.id = ${equipmentId}::uuid AND e.tenant_id = ${reader.tenantId}::uuid
          AND e.deactivated_at IS NULL AND c.deactivated_at IS NULL
        FOR UPDATE OF e FOR SHARE OF c
      `;
        if (!equipment.length)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Solicitação ou equipamento não encontrado.",
          });
        const now = clock();
        const [summary] = await tx.$queryRaw<
          { active_count: number; has_overdue: boolean }[]
        >`
        SELECT count(*)::integer AS active_count, coalesce(bool_or(due_at < ${now}::timestamptz), false) AS has_overdue
        FROM loans WHERE tenant_id = ${reader.tenantId}::uuid
          AND borrower_membership_id = ${reader.membershipId}::uuid AND returned_at IS NULL
      `;
        if (summary.active_count >= 3)
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Você já está com 3 equipamentos. Aguarde uma devolução para solicitar outro.",
          });
        if (summary.has_overdue)
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Você tem equipamento em atraso. Regularize a devolução antes de solicitar outro.",
          });
        if (equipment[0].operational_status !== "AVAILABLE")
          availabilityConflict();
        const loan = await tx.loan.findFirst({
          where: {
            tenant_id: reader.tenantId,
            equipment_id: equipmentId,
            returned_at: null,
          },
          select: { id: true },
        });
        const pending = await tx.loanRequest.findFirst({
          where: {
            tenant_id: reader.tenantId,
            equipment_id: equipmentId,
            status: "PENDING",
          },
          select: { id: true },
        });
        if (loan || pending) availabilityConflict();
        const request = await tx.loanRequest.create({
          data: {
            tenant_id: reader.tenantId,
            equipment_id: equipmentId,
            requester_membership_id: reader.membershipId,
            status: "PENDING",
            requested_at: now,
          },
          select: {
            id: true,
            equipment_id: true,
            status: true,
            requested_at: true,
          },
        });
        await tx.auditLog.create({
          data: {
            tenant_id: reader.tenantId,
            actor_membership_id: reader.membershipId,
            action: "loan_request.created",
            resource_type: "loan_request",
            resource_id: request.id,
            metadata: { equipment_id: equipmentId },
          },
        });
        return request;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 5000,
        timeout: 10000,
      },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" ||
        error.code === "P2034" ||
        (error.code === "P2010" &&
          ["55P03", "40P01", "40001"].includes(String(error.meta?.code))))
    )
      availabilityConflict();
    throw error;
  }
}

export async function listOwnRequests(reader: Reader, input: PageInput) {
  await assertReader(reader);
  const scope = {
    tenant_id: reader.tenantId,
    requester_membership_id: reader.membershipId,
  };
  const cursor = input.cursor
    ? await reader.db.loanRequest.findFirst({
        where: { ...scope, id: input.cursor },
        select: { id: true },
      })
    : null;
  if (input.cursor && !cursor) invalidCursor();
  return page(
    await reader.db.loanRequest.findMany({
      where: scope,
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      orderBy: [{ requested_at: "desc" }, { id: "asc" }],
      take: input.limit + 1,
      select: {
        id: true,
        status: true,
        requested_at: true,
        decided_at: true,
        rejection_reason: true,
        equipment: { select: equipmentSummary },
      },
    }),
    input.limit,
  );
}
