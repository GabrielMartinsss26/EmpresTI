import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../../src/server/db", () => ({ db: {} }));
vi.mock("../../src/server/auth", () => ({ createAuthClient: vi.fn() }));
vi.mock("../../src/server/services/access", () => ({
  getActiveMembership: vi.fn(),
}));
vi.mock("../../src/server/services/login", () => ({ login: vi.fn() }));
import { appRouter } from "../../src/server/api/root";
import type { createContext } from "../../src/server/api/trpc";

type Context = Awaited<ReturnType<typeof createContext>>;
function caller(tenant: string | null) {
  const signOut = vi.fn();
  const context = {
    user: tenant ? { id: `user-${tenant}` } : null,
    membership: tenant
      ? {
          id: `membership-${tenant}`,
          tenant_id: tenant,
          role: "COLLABORATOR",
          profile: { full_name: `Pessoa ${tenant}` },
        }
      : null,
    headers: new Headers(),
    auth: { auth: { signOut } },
  } as unknown as Context;
  return { api: appRouter.createCaller(context), signOut };
}

describe("procedimentos de autenticação e isolamento", () => {
  it("me retorna somente o perfil do contexto e rejeita troca de tenant pelo input", async () => {
    const a = caller("A");
    const b = caller("B");
    expect(await a.api.auth.me()).toEqual({
      name: "Pessoa A",
      role: "COLLABORATOR",
    });
    expect(await b.api.auth.me()).toEqual({
      name: "Pessoa B",
      role: "COLLABORATOR",
    });
    await expect(
      a.api.auth.me({ tenant_id: "B" } as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller(null).api.auth.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
  it("logout afeta somente a sessão do contexto chamador", async () => {
    const a = caller("A");
    const b = caller("B");
    await a.api.auth.logout();
    expect(a.signOut).toHaveBeenCalledOnce();
    expect(b.signOut).not.toHaveBeenCalled();
    await expect(caller(null).api.auth.logout()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });
});
