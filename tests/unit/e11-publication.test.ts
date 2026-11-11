import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
// @ts-expect-error O executor E11 é ESM de operação, sem tipos públicos de aplicação.
const e11 = await import("../../scripts/publicar-e11.mjs");
const {
  approvedMigrations,
  publicationConnection,
  validateRemote,
  validateSources,
} = e11;
const env = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://gverauqgerwjwwjkoybl.supabase.co",
  DATABASE_URL:
    "postgresql://postgres.gverauqgerwjwwjkoybl:fixture@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require",
};
const files = Object.fromEntries(
  Object.keys(approvedMigrations).map((name) => [
    name,
    readFileSync(`prisma/migrations/${name}/migration.sql`),
  ]),
);
describe("E11 / CA-E12: guardas do executor de publicação", () => {
  it("deriva Session Pooler do projeto explícito preservando TLS", () => {
    const url = new URL(publicationConnection(env));
    expect(url.port).toBe("5432");
    expect(url.searchParams.get("sslmode")).toBe("require");
    expect(url.searchParams.has("pgbouncer")).toBe(false);
  });
  it.each([
    { VERCEL: "0" },
    { VERCEL_ENV: "preview" },
    { NEXT_PUBLIC_SUPABASE_URL: "https://outro.supabase.co" },
    {
      DATABASE_URL: env.DATABASE_URL.replace(
        "postgres.gverauqgerwjwwjkoybl",
        "postgres.outro",
      ),
    },
    {
      DATABASE_URL: env.DATABASE_URL.replace(
        "pooler.supabase.com",
        "example.org",
      ),
    },
    { DATABASE_URL: env.DATABASE_URL.replace("/postgres?", "/outro?") },
  ])("recusa destino ou executor divergente %#", (change) => {
    expect(() => publicationConnection({ ...env, ...change })).toThrow();
  });
  it("recusa migration extra ou bytes modificados", () => {
    expect(() => validateSources(files)).not.toThrow();
    expect(() =>
      validateSources({ ...files, extra: Buffer.from("SELECT 1") }),
    ).toThrow();
    expect(() =>
      validateSources({
        ...files,
        "202611090001_loan_due_rules": Buffer.from("SELECT 1"),
      }),
    ).toThrow();
  });
  it("recusa histórico incompleto, falho, duplicado ou com checksum divergente", () => {
    const rows = Object.entries(approvedMigrations)
      .slice(0, 2)
      .map(([migration_name, checksum]) => ({
        migration_name,
        checksum,
        applied: true,
        rolled_back: false,
      }));
    expect(() => validateRemote(rows, files)).not.toThrow();
    expect(() => validateRemote(rows.slice(0, 1), files)).toThrow();
    expect(() => validateRemote([rows[0], rows[0]], files)).toThrow();
    expect(() =>
      validateRemote([{ ...rows[0], applied: false }, rows[1]], files),
    ).toThrow();
    expect(() =>
      validateRemote(
        [{ ...rows[0], checksum: "0".repeat(64) }, rows[1]],
        files,
      ),
    ).toThrow();
  });
});
