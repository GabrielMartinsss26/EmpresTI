import { describe, expect, it } from "vitest";
import { isSameOrigin } from "../../src/lib/same-origin";

describe("origem das mutações de autenticação", () => {
  const check = (origin: string | null, host = "127.0.0.1:3000") =>
    isSameOrigin(
      new Request("http://localhost:3000/api/trpc/auth.login", {
        headers: { host, ...(origin === null ? {} : { origin }) },
      }),
    );

  it("CA-10 permite o host público mesmo com hostname interno diferente", () => {
    expect(check("http://127.0.0.1:3000")).toBe(true);
    expect(check("http://localhost:3000", "localhost:3000")).toBe(true);
  });

  it("recusa origem externa, porta ou protocolo diferentes e origem ausente", () => {
    for (const origin of [
      "https://example.com",
      "http://127.0.0.1:4000",
      "https://127.0.0.1:3000",
      "null",
      null,
    ]) {
      expect(check(origin)).toBe(false);
    }
  });
});
