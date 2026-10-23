import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  bucket: vi.fn(),
  audit: vi.fn(),
  membership: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));
vi.mock("../../src/server/db", () => ({
  db: {
    $transaction: mocks.transaction,
    rateLimitBucket: { upsert: mocks.bucket },
    auditLog: { create: mocks.audit },
  },
}));
vi.mock("../../src/server/auth", () => ({
  createAuthClient: async () => ({
    auth: { signInWithPassword: mocks.signIn, signOut: mocks.signOut },
  }),
}));
vi.mock("../../src/server/services/access", () => ({
  getActiveMembership: mocks.membership,
}));
import { login } from "../../src/server/services/login";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.transaction.mockResolvedValue([{ count: 1 }, { count: 1 }]);
});
describe("login no servidor", () => {
  it("bloqueia excesso de tentativas antes de chamar o provedor", async () => {
    mocks.transaction.mockResolvedValue([{ count: 6 }, { count: 1 }]);
    await expect(
      login({ email: "a@example.com", password: "x" }, "127.0.0.1"),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mocks.signIn).not.toHaveBeenCalled();
  });
  it("devolve erro genérico para credenciais inválidas", async () => {
    mocks.signIn.mockResolvedValue({
      data: { user: null },
      error: { message: "details" },
    });
    await expect(
      login({ email: "a@example.com", password: "x" }, "127.0.0.1"),
    ).rejects.toMatchObject({ message: "E-mail ou senha inválidos." });
    expect(mocks.membership).not.toHaveBeenCalled();
  });
  it("encerra sessão de usuário sem vínculo ativo", async () => {
    mocks.signIn.mockResolvedValue({
      data: { user: { id: "user-a" } },
      error: null,
    });
    mocks.membership.mockResolvedValue(null);
    await expect(
      login({ email: "a@example.com", password: "x" }, "127.0.0.1"),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.signOut).toHaveBeenCalled();
  });
  it("resolve o vínculo pela identidade autenticada e audita o tenant retornado", async () => {
    mocks.signIn.mockResolvedValue({
      data: { user: { id: "user-a" } },
      error: null,
    });
    mocks.membership.mockResolvedValue({
      id: "member-a",
      tenant_id: "tenant-a",
    });
    await expect(
      login({ email: "a@example.com", password: "x" }, "127.0.0.1"),
    ).resolves.toEqual({ destination: "/catalogo" });
    expect(mocks.membership).toHaveBeenCalledWith("user-a");
    expect(mocks.audit).toHaveBeenCalledWith({
      data: {
        tenant_id: "tenant-a",
        actor_membership_id: "member-a",
        action: "auth.login",
        resource_type: "membership",
        resource_id: "member-a",
      },
    });
  });
});
