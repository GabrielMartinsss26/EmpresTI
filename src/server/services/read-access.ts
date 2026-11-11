import "server-only";
import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export type Reader = {
  db: PrismaClient;
  userId: string;
  tenantId: string;
  membershipId: string;
};

export async function assertReader(reader: Reader) {
  const membership = await reader.db.membership.findFirst({
    where: {
      id: reader.membershipId,
      user_id: reader.userId,
      tenant_id: reader.tenantId,
      deactivated_at: null,
      profile: { deactivated_at: null },
      tenant: { deactivated_at: null },
    },
    select: { id: true },
  });
  if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
}

export function invalidCursor(): never {
  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Página inválida. Atualize a lista.",
  });
}

export const equipmentSummary = {
  id: true,
  asset_tag: true,
  name: true,
  pickup_location: true,
} as const;
