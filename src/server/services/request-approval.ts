import "server-only";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { Reader } from "./read-access";
import { equipmentSummary, invalidCursor } from "./read-access";
import { page, type PageInput } from "./read-input";
import { createLoanPeriod } from "./loan-due-date";

const permissionMessage = "Você não tem permissão para decidir solicitações.";
function forbidden(): never {
  throw new TRPCError({ code: "FORBIDDEN", message: permissionMessage });
}
function conflict(): never {
  throw new TRPCError({
    code: "CONFLICT",
    message: "A disponibilidade mudou. Atualize a lista e tente novamente.",
  });
}
function notFound(): never {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: "Solicitação ou equipamento não encontrado.",
  });
}

async function assertDecisionMaker(reader: Reader) {
  const actor = await reader.db.membership.findFirst({
    where: {
      id: reader.membershipId,
      user_id: reader.userId,
      tenant_id: reader.tenantId,
      role: { in: ["OPERATIONS", "ADMIN"] },
      deactivated_at: null,
      profile: { deactivated_at: null },
      tenant: { deactivated_at: null },
    },
    select: { id: true },
  });
  if (!actor) forbidden();
}

export async function listPendingRequests(reader: Reader, input: PageInput) {
  await assertDecisionMaker(reader);
  const scope = { tenant_id: reader.tenantId, status: "PENDING" as const };
  if (
    input.cursor &&
    !(await reader.db.loanRequest.findFirst({
      where: { ...scope, id: input.cursor },
      select: { id: true },
    }))
  )
    invalidCursor();
  return page(
    await reader.db.loanRequest.findMany({
      where: scope,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      orderBy: [{ requested_at: "asc" }, { id: "asc" }],
      take: input.limit + 1,
      select: {
        id: true,
        status: true,
        requested_at: true,
        equipment: {
          select: {
            ...equipmentSummary,
            operational_status: true,
            deactivated_at: true,
          },
        },
        requester: {
          select: {
            deactivated_at: true,
            profile: { select: { full_name: true, deactivated_at: true } },
          },
        },
      },
    }),
    input.limit,
  );
}

export async function approveRequest(
  reader: Reader,
  requestId: string,
  clock: () => Date = () => new Date(),
) {
  await assertDecisionMaker(reader);
  const initial = await reader.db.loanRequest.findFirst({
    where: { id: requestId, tenant_id: reader.tenantId },
    select: { equipment_id: true, requester_membership_id: true },
  });
  if (!initial) notFound();
  try {
    return await reader.db.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL lock_timeout = '3s'");
        // Todos os vínculos vêm antes de equipamento/pedido, em ordem global estável.
        const members = await tx.$queryRaw<
          { id: string; user_id: string; role: string }[]
        >`
        SELECT m.id, m.user_id, m.role FROM memberships m
        JOIN profiles p ON p.id = m.user_id JOIN tenants t ON t.id = m.tenant_id
        WHERE m.tenant_id = ${reader.tenantId}::uuid
          AND m.id IN (${initial.requester_membership_id}::uuid, ${reader.membershipId}::uuid)
          AND m.deactivated_at IS NULL AND p.deactivated_at IS NULL AND t.deactivated_at IS NULL
        ORDER BY m.id FOR UPDATE OF m FOR SHARE OF p, t
      `;
        const actor = members.find(
          (member) => member.id === reader.membershipId,
        );
        if (
          !actor ||
          actor.user_id !== reader.userId ||
          !["OPERATIONS", "ADMIN"].includes(actor.role)
        )
          forbidden();
        if (
          !members.some(
            (member) => member.id === initial.requester_membership_id,
          )
        )
          throw new TRPCError({ code: "FORBIDDEN" });
        const equipment = await tx.$queryRaw<{ operational_status: string }[]>`
        SELECT e.operational_status FROM equipment e
        JOIN equipment_categories c ON c.id = e.category_id AND c.tenant_id = e.tenant_id
        WHERE e.id = ${initial.equipment_id}::uuid AND e.tenant_id = ${reader.tenantId}::uuid
          AND e.deactivated_at IS NULL AND c.deactivated_at IS NULL
        FOR UPDATE OF e FOR SHARE OF c
      `;
        const requests = await tx.$queryRaw<
          {
            id: string;
            status: string;
            equipment_id: string;
            requester_membership_id: string;
          }[]
        >`
        SELECT id, status, equipment_id, requester_membership_id FROM loan_requests
        WHERE id = ${requestId}::uuid AND tenant_id = ${reader.tenantId}::uuid FOR UPDATE
      `;
        const request = requests[0];
        if (!request) notFound();
        if (
          request.equipment_id !== initial.equipment_id ||
          request.requester_membership_id !== initial.requester_membership_id
        )
          conflict();
        if (request.status !== "PENDING")
          throw new TRPCError({
            code: "CONFLICT",
            message: "Esta solicitação já foi decidida. Atualize a lista.",
          });
        if (
          !equipment.length ||
          equipment[0].operational_status !== "AVAILABLE"
        )
          conflict();
        const { checkedOutAt, dueAt } = createLoanPeriod(clock);
        const [summary] = await tx.$queryRaw<
          { active_count: number; has_overdue: boolean }[]
        >`
        SELECT count(*)::integer AS active_count, coalesce(bool_or(due_at < ${checkedOutAt}::timestamptz), false) AS has_overdue
        FROM loans WHERE tenant_id = ${reader.tenantId}::uuid
          AND borrower_membership_id = ${initial.requester_membership_id}::uuid AND returned_at IS NULL
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
        if (
          await tx.loan.findFirst({
            where: {
              tenant_id: reader.tenantId,
              equipment_id: initial.equipment_id,
              returned_at: null,
            },
            select: { id: true },
          })
        )
          conflict();
        const updated = await tx.loanRequest.updateMany({
          where: {
            id: requestId,
            tenant_id: reader.tenantId,
            status: "PENDING",
            requested_at: { lte: checkedOutAt },
          },
          data: {
            status: "APPROVED",
            decided_at: checkedOutAt,
            decided_by_membership_id: reader.membershipId,
          },
        });
        if (updated.count !== 1) conflict();
        const loan = await tx.loan.create({
          data: {
            tenant_id: reader.tenantId,
            loan_request_id: requestId,
            equipment_id: initial.equipment_id,
            borrower_membership_id: initial.requester_membership_id,
            approved_by_membership_id: reader.membershipId,
            checked_out_at: checkedOutAt,
            due_at: dueAt,
            due_rule: "BUSINESS_14_SP",
          },
          select: {
            id: true,
            loan_request_id: true,
            equipment_id: true,
            checked_out_at: true,
            due_at: true,
            due_rule: true,
          },
        });
        await tx.auditLog.create({
          data: {
            tenant_id: reader.tenantId,
            actor_membership_id: reader.membershipId,
            action: "loan_request.approved",
            resource_type: "loan_request",
            resource_id: requestId,
            metadata: { equipment_id: initial.equipment_id, loan_id: loan.id },
          },
        });
        return {
          request: {
            id: requestId,
            status: "APPROVED" as const,
            decided_at: checkedOutAt,
          },
          loan,
        };
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
      conflict();
    throw error;
  }
}
