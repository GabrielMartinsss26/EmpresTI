import { afterEach, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getEnv } from "../../src/server/env";
afterEach(() => vi.unstubAllEnvs());
it("falha com nomes de variáveis e não imprime credencial", () => {
  vi.stubEnv("DATABASE_URL", "");
  expect(() => getEnv()).toThrow(/DATABASE_URL/);
});
