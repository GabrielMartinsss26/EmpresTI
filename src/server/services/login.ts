import "server-only";
import { createHash } from "node:crypto";
import { TRPCError } from "@trpc/server";
import type { z } from "zod";
import { db } from "../db";
import { createAuthClient } from "../auth";
import { getActiveMembership } from "./access";
import type { loginInput } from "@/lib/auth-input";

export async function login(input: z.infer<typeof loginInput>, ip: string) {
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / 900_000) * 900_000);
  const expiresAt = new Date(windowStart.getTime() + 900_000);
  const counts = await db.$transaction([
    ...(
      [
        ["login-ip", ip],
        ["login-email", input.email],
      ] as const
    ).map(([scope, subject]) => {
      const hash = createHash("sha256").update(subject).digest("hex");
      return db.rateLimitBucket.upsert({
        where: {
          scope_subject_hash_window_start: {
            scope,
            subject_hash: hash,
            window_start: windowStart,
          },
        },
        create: {
          scope,
          subject_hash: hash,
          window_start: windowStart,
          expires_at: expiresAt,
          count: 1,
        },
        update: { count: { increment: 1 } },
      });
    }),
  ]);
  if (counts.some((bucket) => bucket.count > 5))
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Muitas tentativas. Tente novamente em 15 minutos.",
    });

  const auth = await createAuthClient();
  const { data, error } = await auth.auth.signInWithPassword(input);
  if (error || !data.user)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "E-mail ou senha inválidos.",
    });
  const membership = await getActiveMembership(data.user.id);
  if (!membership) {
    await auth.auth.signOut();
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Seu acesso não está ativo. Fale com Operações.",
    });
  }
  await db.auditLog.create({
    data: {
      tenant_id: membership.tenant_id,
      actor_membership_id: membership.id,
      action: "auth.login",
      resource_type: "membership",
      resource_id: membership.id,
    },
  });
  return { destination: "/catalogo" as const };
}
