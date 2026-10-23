import { z } from "zod";
import { loginInput } from "@/lib/auth-input";
import { login } from "@/server/services/login";
import {
  router,
  publicProcedure,
  protectedProcedure,
  tenantProcedure,
} from "../trpc";

export const authRouter = router({
  login: publicProcedure.input(loginInput).mutation(({ input, ctx }) => {
    // Vercel sobrescreve este cabeçalho; fora dela o limite usa o endereço local.
    const ip = process.env.VERCEL
      ? (ctx.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown")
      : "local";
    return login(input, ip);
  }),
  me: tenantProcedure.input(z.void()).query(({ ctx }) => ({
    name: ctx.membership.profile.full_name,
    role: ctx.role,
  })),
  logout: protectedProcedure.input(z.void()).mutation(async ({ ctx }) => {
    await ctx.auth.auth.signOut();
    return { destination: "/login" as const };
  }),
});
