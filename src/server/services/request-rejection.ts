import "server-only";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { Reader } from "./read-access";
import { assertDecisionMaker } from "./request-approval";

export const rejectionReason = z
  .string()
  .trim()
  .min(1, "Informe o motivo da rejeição.")
  .max(500, "Informe o motivo da rejeição.");
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

export async function rejectRequest(
  reader: Reader,
  requestId: string,
  reason: string,
  clock: () => Date = () => new Date(),
) {
  const parsed = rejectionReason.safeParse(reason);
  if (!parsed.success)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Informe o motivo da rejeição.",
    });
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
        // Mesma ordem de vínculos/equipamento/pedido da aprovação E05.
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
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Você não tem permissão para decidir solicitações.",
          });
        if (
          !members.some(
            (member) => member.id === initial.requester_membership_id,
          )
        )
          throw new TRPCError({ code: "FORBIDDEN" });
        const equipment = await tx.$queryRaw<{ id: string }[]>`
        SELECT e.id FROM equipment e
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
        if (!equipment.length) conflict();
        const decidedAt = new Date(clock().getTime());
        const updated = await tx.loanRequest.updateMany({
          where: {
            id: requestId,
            tenant_id: reader.tenantId,
            status: "PENDING",
            requested_at: { lte: decidedAt },
          },
          data: {
            status: "REJECTED",
            rejection_reason: parsed.data,
            decided_at: decidedAt,
            decided_by_membership_id: reader.membershipId,
          },
        });
        if (updated.count !== 1) conflict();
        await tx.auditLog.create({
          data: {
            tenant_id: reader.tenantId,
            actor_membership_id: reader.membershipId,
            action: "loan_request.rejected",
            resource_type: "loan_request",
            resource_id: requestId,
            metadata: { equipment_id: initial.equipment_id },
          },
        });
        return {
          id: requestId,
          status: "REJECTED" as const,
          decided_at: decidedAt,
          rejection_reason: parsed.data,
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
