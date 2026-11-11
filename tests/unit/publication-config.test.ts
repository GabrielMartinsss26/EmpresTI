import { describe, expect, it } from "vitest";
import {
  publicationConfig,
  publicationProject,
} from "../../scripts/publicar-pratica";

const config = {
  DIRECT_URL: `postgresql://postgres:DB_PASSWORD@db.${publicationProject}.supabase.co:5432/postgres`,
  DATABASE_URL: `postgresql://postgres.${publicationProject}:DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
  NEXT_PUBLIC_SUPABASE_URL: `https://${publicationProject}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "PLACEHOLDER",
  SUPABASE_SERVICE_ROLE_KEY: "PLACEHOLDER",
};
const args = ["--apply", `--project=${publicationProject}`];
describe("D08 · CA-D07 — validação antes de conexões/mutações", () => {
  it("exige destino explícito e recusa banco/API de outro projeto", () => {
    expect(() => publicationConfig(config, [])).toThrow();
    expect(() =>
      publicationConfig(config, ["--apply", "--project=outro"]),
    ).toThrow();
    expect(() =>
      publicationConfig(
        {
          ...config,
          DIRECT_URL:
            "postgresql://postgres:PLACEHOLDER@localhost:5432/postgres",
        },
        args,
      ),
    ).toThrow("Banco");
    expect(() =>
      publicationConfig(
        { ...config, NEXT_PUBLIC_SUPABASE_URL: "https://outro.supabase.co" },
        args,
      ),
    ).toThrow("API");
    expect(publicationConfig(config, args).NEXT_PUBLIC_SUPABASE_URL).toBe(
      config.NEXT_PUBLIC_SUPABASE_URL,
    );
  });
  it("não inclui configuração recebida no erro", () => {
    try {
      publicationConfig(
        { ...config, DIRECT_URL: "VALOR-FICTICIO-INVALIDO" },
        args,
      );
      expect.fail();
    } catch (error) {
      expect(String(error)).not.toContain("VALOR-FICTICIO-INVALIDO");
    }
  });
});
