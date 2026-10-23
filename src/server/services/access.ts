import "server-only";
import { db } from "../db";

export function getActiveMembership(userId: string) {
  return db.membership.findFirst({
    where: {
      user_id: userId,
      deactivated_at: null,
      profile: { deactivated_at: null },
      tenant: { slug: "suporte_ti", deactivated_at: null },
    },
    include: { profile: true, tenant: true },
  });
}
