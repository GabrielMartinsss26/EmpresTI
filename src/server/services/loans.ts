import "server-only";
import {
  assertReader,
  equipmentSummary,
  invalidCursor,
  type Reader,
} from "./read-access";
import { page, type PageInput } from "./read-input";

export async function loanSummary(
  reader: Reader,
  clock: () => Date = () => new Date(),
) {
  await assertReader(reader);
  const rows = await reader.db.loan.findMany({
    where: {
      tenant_id: reader.tenantId,
      borrower_membership_id: reader.membershipId,
      returned_at: null,
    },
    select: { due_at: true },
  });
  const now = clock().getTime();
  return {
    activeCount: rows.length,
    maxActive: 3,
    hasOverdue: rows.some(({ due_at }) => due_at.getTime() < now),
  };
}

export async function listOwnLoans(reader: Reader, input: PageInput) {
  await assertReader(reader);
  const scope = {
    tenant_id: reader.tenantId,
    borrower_membership_id: reader.membershipId,
    returned_at: null,
  };
  const cursor = input.cursor
    ? await reader.db.loan.findFirst({
        where: { ...scope, id: input.cursor },
        select: { id: true },
      })
    : null;
  if (input.cursor && !cursor) invalidCursor();
  return page(
    await reader.db.loan.findMany({
      where: scope,
      // Prisma compara o timestamp no SQL sem truncar microssegundos em Date.
      ...(cursor ? { cursor: { id: cursor.id }, skip: 1 } : {}),
      orderBy: [{ checked_out_at: "desc" }, { id: "asc" }],
      take: input.limit + 1,
      select: {
        id: true,
        checked_out_at: true,
        due_at: true,
        due_rule: true,
        return_requested_at: true,
        equipment: { select: equipmentSummary },
      },
    }),
    input.limit,
  );
}
