import "server-only";
import {
  assertReader,
  equipmentSummary,
  invalidCursor,
  type Reader,
} from "./read-access";
import { page, type PageInput } from "./read-input";

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
