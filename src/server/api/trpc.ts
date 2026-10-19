import "server-only";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { createAuthClient } from "../auth";
import { getActiveMembership } from "../services/access";

export async function createContext({ headers }: { headers: Headers }) {
  const auth = await createAuthClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  const membership = user ? await getActiveMembership(user.id) : null;
  return { auth, user, membership, headers };
}

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      message:
        error.code === "INTERNAL_SERVER_ERROR"
          ? "Não foi possível entrar agora. Tente novamente."
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
