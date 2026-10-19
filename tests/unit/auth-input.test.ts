import { describe, expect, it } from "vitest";
import { loginInput } from "../../src/lib/auth-input";
describe("entrada de login", () => {
  it("recusa e-mail inválido e senha vazia", () => {
    expect(
      loginInput.safeParse({ email: "invalido", password: "" }).success,
    ).toBe(false);
  });
  it("normaliza e-mail sem alterar a senha existente", () => {
    expect(
      loginInput.parse({ email: "Pessoa@Empresa.com", password: " a " }),
    ).toEqual({ email: "pessoa@empresa.com", password: " a " });
  });
});
