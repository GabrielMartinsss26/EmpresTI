import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createAuthClient } from "../auth";
import { getActiveMembership } from "../services/access";
import { db } from "../db";

export async function createContext({ headers }: { headers: Headers }) {
  const auth = await createAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  const membership = user ? await getActiveMembership(user.id) : null;
  return { auth, user, membership, headers, db };
}

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error, path }) {
    return {
      ...shape,
      message:
        error.code === "INTERNAL_SERVER_ERROR"
          ? path?.startsWith("auth.")
            ? "Não foi possível entrar agora. Tente novamente."
            : "Não foi possível concluir agora. Tente novamente."
          : shape.message,
      data: { ...shape.data, stack: undefined },
    };
  },
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, user: ctx.user } });
});
export const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.membership) throw new TRPCError({ code: "FORBIDDEN" });
  return next({
    ctx: {
      ...ctx,
      membership: ctx.membership,
      tenantId: ctx.membership.tenant_id,
      role: ctx.membership.role,
    },
  });
});
export const adminProcedure = tenantProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "ADMIN") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
export const operationsProcedure = tenantProcedure.use(({ ctx, next }) => {
  if (ctx.role !== "OPERATIONS" && ctx.role !== "ADMIN")
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Você não tem permissão para decidir solicitações.",
    });
  return next({ ctx });
});
