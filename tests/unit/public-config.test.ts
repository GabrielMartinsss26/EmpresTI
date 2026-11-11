import { describe, expect, it } from "vitest";
import { publicConfig, equipmentImageUrl } from "../../src/lib/public-config";
import { displayDate } from "../../src/lib/display-date";
import { pageInput } from "../../src/server/services/read-input";
describe("CA-E01/E09 — configuração pública e datas", () => {
  it("aceita direction forward enviado pelo tRPC infinite e mantém validação estrita", () => {
    expect(pageInput.parse({ direction: "forward" })).toEqual({
      direction: "forward",
      limit: 12,
    });
    expect(pageInput.safeParse({ direction: "backward" }).success).toBe(false);
    expect(pageInput.safeParse({ tenantId: "externo" }).success).toBe(false);
  });
  it("limita origem/caminho de fotos sem incluir outros valores do ambiente", () => {
    expect(
      publicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture",
        SECRET: "omitido",
      }),
    ).toEqual({
      url: "https://fixture.supabase.co",
      key: "fixture",
      imageBase:
        "https://fixture.supabase.co/storage/v1/object/public/equipamentos/",
    });
    for (const url of [
      "https://user:password@fixture.test",
      "https://fixture.test/path",
      "javascript:alert(1)",
      "https://fixture.test/?x=1",
    ])
      expect(() =>
        publicConfig({
          NEXT_PUBLIC_SUPABASE_URL: url,
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "fixture",
        }),
      ).toThrow();
  });
  it("não aceita outro bucket ou segmentos que escapam do caminho público", () => {
    const base = "https://fixture.test/storage/v1/object/public/equipamentos/";
    expect(
      equipmentImageUrl(base, "equipamentos", "suporte_ti/TI-0001.webp"),
    ).toBe(`${base}suporte_ti/TI-0001.webp`);
    for (const path of ["../arquivo", "a/../b", "/arquivo", "a\\b", "a//b"])
      expect(equipmentImageUrl(base, "equipamentos", path)).toBeNull();
    expect(equipmentImageUrl(base, "privado", "arquivo.webp")).toBeNull();
  });
  it("mostra o instante real em São Paulo, incluindo virada de data UTC", () => {
    expect(displayDate(new Date("2026-11-28T01:30:00Z"))).toBe(
      "27/nov/2026 · 22:30",
    );
  });
});
