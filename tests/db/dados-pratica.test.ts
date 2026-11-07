import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { type StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { type PrismaClient } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, basename } from "node:path";
import sharp from "sharp";
import {
  inventory,
  populatePractice,
  PopulationConflict,
  validatePackage,
} from "../../prisma/dados-pratica";
import { startTestDatabase } from "./setup";
import manifestOriginal from "../../docs/verificacoes/imagens/d03-manifesto.json";
import proofOriginal from "../../docs/verificacoes/imagens/d03-final.json";

let db: PrismaClient;
let container: StartedPostgreSqlContainer;
let directory: string;
let manifest: typeof manifestOriginal;
let proof: typeof proofOriginal;
let bundle: Awaited<ReturnType<typeof validatePackage>>;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), "empresti-d05-"));
  manifest = structuredClone(manifestOriginal);
  proof = structuredClone(proofOriginal);
  for (const [index, entry] of manifest.entries.entries()) {
    const bytes = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: index * 19, g: 40, b: 80 },
      },
    })
      .webp()
      .toBuffer();
    entry.sha256 = createHash("sha256").update(bytes).digest("hex");
    const evidence = proof.files.find((f) => f.assetTag === entry.assetTag)!;
    evidence.bytes = bytes.length;
    evidence.sha256 = entry.sha256;
    await writeFile(join(directory, entry.file), bytes);
  }
  bundle = await validatePackage(directory, manifest, proof);
  ({ db, container } = await startTestDatabase());
});
beforeEach(async () => {
  // Somente fixtures do container; não é caminho de reset da aplicação.
  await db.$executeRawUnsafe(
    "TRUNCATE public.tenants, public.profiles, auth.users CASCADE",
  );
});
afterAll(async () => {
  await db?.$disconnect();
  await container?.stop();
  if (
    directory &&
    dirname(directory) === tmpdir() &&
    basename(directory).startsWith("empresti-d05-")
  )
    await rm(directory, { recursive: true });
});

async function snapshot() {
  return {
    tenants: await db.tenant.findMany({ orderBy: { id: "asc" } }),
    categories: await db.equipmentCategory.findMany({ orderBy: { id: "asc" } }),
    equipment: await db.equipment.findMany({ orderBy: { id: "asc" } }),
    images: await db.equipmentImage.findMany({ orderBy: { id: "asc" } }),
    requests: await db.loanRequest.findMany({ orderBy: { id: "asc" } }),
    loans: await db.loan.findMany({ orderBy: { id: "asc" } }),
  };
}

describe("D05 · CA-D01/CA-D02 — população em PostgreSQL descartável", () => {
  it("D08 · simulação informa ausentes sem criar ou atualizar dados", async () => {
    const before = await snapshot();
    expect(
      (await populatePractice(db, bundle, { dryRun: true })).created,
    ).toEqual({ tenants: 1, categories: 4, equipment: 12, images: 12 });
    expect(await snapshot()).toEqual(before);
    await populatePractice(db, bundle);
    const populated = await snapshot();
    expect(
      (await populatePractice(db, bundle, { dryRun: true })).created,
    ).toEqual({ tenants: 0, categories: 0, equipment: 0, images: 0 });
    expect(await snapshot()).toEqual(populated);
  });

  it("D08 · simulação interrompe por conflito sem alterar registros", async () => {
    await populatePractice(db, bundle);
    await db.equipment.updateMany({ data: { pickup_location: "Alterado" } });
    const before = await snapshot();
    await expect(
      populatePractice(db, bundle, { dryRun: true }),
    ).rejects.toBeInstanceOf(PopulationConflict);
    expect(await snapshot()).toEqual(before);
  });

  it("cria o inventário exato, sem identidades/pedidos/empréstimos, e reexecuta sem alterar IDs ou timestamps", async () => {
    const first = await populatePractice(db, bundle);
    expect(first.created).toEqual({
      tenants: 1,
      categories: 4,
      equipment: 12,
      images: 12,
    });
    const rows = await db.equipment.findMany({
      orderBy: { asset_tag: "asc" },
      include: { category: true, image: true },
    });
    expect(
      rows.map((e) => [
        e.asset_tag,
        e.name,
        e.category.name,
        e.operational_status,
      ]),
    ).toEqual(inventory);
    expect(
      rows.every(
        (e) =>
          e.pickup_location === "Operações" &&
          e.serial_number === null &&
          e.description === null &&
          e.image?.object_path === `suporte_ti/${e.asset_tag}.webp`,
      ),
    ).toBe(true);
    expect(
      rows.filter((e) => e.operational_status === "MAINTENANCE"),
    ).toHaveLength(3);
    expect(
      rows.filter((e) => e.operational_status === "AVAILABLE"),
    ).toHaveLength(9);
    expect(await db.profile.count()).toBe(0);
    expect(await db.membership.count()).toBe(0);
    const before = await snapshot();
    expect(before.requests).toHaveLength(0);
    expect(before.loans).toHaveLength(0);
    expect((await populatePractice(db, bundle)).created).toEqual({
      tenants: 0,
      categories: 0,
      equipment: 0,
      images: 0,
    });
    expect(await snapshot()).toEqual(before);
  });

  it("reutiliza cadastro anterior sem imagem, preserva série/descrições e outros tenants", async () => {
    const tenant = await db.tenant.create({
      data: { slug: "suporte_ti", name: "Suporte TI" },
    });
    const category = await db.equipmentCategory.create({
      data: {
        tenant_id: tenant.id,
        name: "notebook",
        description: "Descrição anterior",
      },
    });
    const item = await db.equipment.create({
      data: {
        tenant_id: tenant.id,
        category_id: category.id,
        asset_tag: "TI-0001",
        name: "Notebook 14 polegadas",
        pickup_location: "Operações",
        serial_number: "SERIE-EXISTENTE",
        description: "Existente",
      },
    });
    const other = await db.tenant.create({
      data: { slug: "outro", name: "Outro" },
    });
    const otherCategory = await db.equipmentCategory.create({
      data: { tenant_id: other.id, name: "notebook" },
    });
    const unrelated = await db.equipment.create({
      data: {
        tenant_id: other.id,
        category_id: otherCategory.id,
        asset_tag: "TI-0001",
        name: "Outro",
        pickup_location: "Outro",
      },
    });
    expect((await populatePractice(db, bundle)).created).toEqual({
      tenants: 0,
      categories: 3,
      equipment: 11,
      images: 12,
    });
    expect(await db.equipment.findUnique({ where: { id: item.id } })).toEqual(
      item,
    );
    expect(
      await db.equipmentCategory.findUnique({ where: { id: category.id } }),
    ).toEqual(category);
    expect(
      await db.equipment.findUnique({ where: { id: unrelated.id } }),
    ).toEqual(unrelated);
  });

  it.each([
    "tenant nome",
    "tenant inativo",
    "categoria inativa",
    "equipamento inativo",
    "nome",
    "categoria",
    "retirada",
    "situação",
    "imagem inativa",
    "imagem hash",
    "pedido pendente",
    "empréstimo ativo",
    "destino ocupado",
  ])(
    "interrompe todo o lote por conflito: %s, preservando inclusive os ausentes",
    async (kind) => {
      const { tenantId } = await populatePractice(db, bundle);
      const item = await db.equipment.findFirstOrThrow({
        where: { asset_tag: "TI-0001" },
      });
      if (kind === "tenant nome")
        await db.tenant.update({
          where: { id: tenantId },
          data: { name: "Alterado" },
        });
      if (kind === "tenant inativo")
        await db.tenant.update({
          where: { id: tenantId },
          data: { deactivated_at: new Date() },
        });
      if (kind === "categoria inativa")
        await db.equipmentCategory.update({
          where: { id: item.category_id },
          data: { deactivated_at: new Date() },
        });
      if (kind === "equipamento inativo")
        await db.equipment.update({
          where: { id: item.id },
          data: { deactivated_at: new Date() },
        });
      if (kind === "nome")
        await db.equipment.update({
          where: { id: item.id },
          data: { name: "Alterado" },
        });
      if (kind === "categoria") {
        const category = await db.equipmentCategory.findFirstOrThrow({
          where: { name: "cabo" },
        });
        await db.equipment.update({
          where: { id: item.id },
          data: { category_id: category.id },
        });
      }
      if (kind === "retirada")
        await db.equipment.update({
          where: { id: item.id },
          data: { pickup_location: "Outro" },
        });
      if (kind === "situação")
        await db.equipment.update({
          where: { id: item.id },
          data: { operational_status: "MAINTENANCE" },
        });
      if (kind === "imagem inativa")
        await db.equipmentImage.update({
          where: { equipment_id: item.id },
          data: { deactivated_at: new Date() },
        });
      if (kind === "imagem hash")
        await db.equipmentImage.update({
          where: { equipment_id: item.id },
          data: { sha256: "a".repeat(64) },
        });
      if (kind === "destino ocupado") {
        const category = await db.equipmentCategory.findFirstOrThrow({
          where: { name: "cabo" },
        });
        const other = await db.equipment.create({
          data: {
            tenant_id: tenantId,
            category_id: category.id,
            name: "Outro",
            asset_tag: "OUTRO",
            pickup_location: "Operações",
          },
        });
        await db.equipmentImage.update({
          where: { equipment_id: item.id },
          data: { equipment_id: other.id },
        });
      }
      if (["pedido pendente", "empréstimo ativo"].includes(kind)) {
        const user = randomUUID();
        await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${user}::uuid)`;
        await db.profile.create({ data: { id: user, full_name: "Fixture" } });
        const membership = await db.membership.create({
          data: { tenant_id: tenantId, user_id: user, role: "ADMIN" },
        });
        const now = new Date();
        const request = await db.loanRequest.create({
          data: {
            tenant_id: tenantId,
            equipment_id: item.id,
            requester_membership_id: membership.id,
            requested_at: now,
            ...(kind === "empréstimo ativo"
              ? {
                  status: "APPROVED",
                  decided_at: now,
                  decided_by_membership_id: membership.id,
                }
              : {}),
          },
        });
        if (kind === "empréstimo ativo")
          await db.loan.create({
            data: {
              tenant_id: tenantId,
              loan_request_id: request.id,
              equipment_id: item.id,
              borrower_membership_id: membership.id,
              approved_by_membership_id: membership.id,
              checked_out_at: now,
              due_at: new Date(now.getTime() + 14 * 86_400_000),
            },
          });
      }
      const conflictingImage = [
        "imagem inativa",
        "imagem hash",
        "destino ocupado",
      ].includes(kind)
        ? await db.equipmentImage.findFirstOrThrow({
            where: { object_path: "suporte_ti/TI-0001.webp" },
          })
        : null;
      // Limpeza somente da fixture local: deixar referências ausentes para provar atomicidade.
      await db.$executeRawUnsafe("TRUNCATE public.equipment_images");
      if (conflictingImage)
        await db.equipmentImage.create({ data: conflictingImage });
      const before = await snapshot();
      await expect(populatePractice(db, bundle)).rejects.toBeInstanceOf(
        PopulationConflict,
      );
      expect(await snapshot()).toEqual(before);
    },
  );

  it("faz rollback também se o banco rejeitar uma escrita no fim do lote", async () => {
    await db.$executeRawUnsafe(
      "CREATE FUNCTION public.reject_d05_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.object_path = 'suporte_ti/TI-0012.webp' THEN RAISE EXCEPTION 'falha D05 fixture'; END IF; RETURN NEW; END $$",
    );
    await db.$executeRawUnsafe(
      "CREATE TRIGGER reject_d05_fixture BEFORE INSERT ON public.equipment_images FOR EACH ROW EXECUTE FUNCTION public.reject_d05_fixture()",
    );
    const before = await snapshot();
    try {
      await expect(populatePractice(db, bundle)).rejects.toThrow(
        "falha D05 fixture",
      );
      expect(await snapshot()).toEqual(before);
    } finally {
      await db.$executeRawUnsafe(
        "DROP TRIGGER reject_d05_fixture ON public.equipment_images",
      );
      await db.$executeRawUnsafe("DROP FUNCTION public.reject_d05_fixture()");
    }
  });

  it("informa todos os conflitos encontrados, sem corrigir os registros", async () => {
    await populatePractice(db, bundle);
    await db.equipment.updateMany({ data: { pickup_location: "Alterado" } });
    const before = await snapshot();
    try {
      await populatePractice(db, bundle);
      expect.fail("Deveria interromper o lote");
    } catch (error) {
      expect(error).toBeInstanceOf(PopulationConflict);
      expect((error as PopulationConflict).conflicts).toHaveLength(12);
    }
    expect(await snapshot()).toEqual(before);
  });
});

describe("D05 · CA-D03/CA-D07 — pacote antes de escrever", () => {
  it.each([
    "hash",
    "caminho",
    "repetição",
    "tipo",
    "patrimônio",
    "crédito",
    "tamanho",
  ])("rejeita pacote inválido: %s", async (kind) => {
    const candidate = structuredClone(manifest);
    const evidence = structuredClone(proof);
    if (kind === "hash") candidate.entries[0].sha256 = "f".repeat(64);
    if (kind === "caminho") candidate.entries[0].file = "../../fora.webp";
    if (kind === "repetição")
      candidate.entries[1].source.id = candidate.entries[0].source.id;
    if (kind === "tipo") evidence.files[0].type = "illustration";
    if (kind === "patrimônio") candidate.entries[0].assetTag = "TI-9999";
    if (kind === "crédito") candidate.entries[0].source.author = "";
    if (kind === "tamanho") evidence.files[0].bytes++;
    await expect(
      validatePackage(directory, candidate, evidence),
    ).rejects.toThrow();
    expect(await db.tenant.count()).toBe(0);
  });

  it("decodifica o arquivo e rejeita dimensões reais erradas mesmo com hashes coerentes", async () => {
    const file = join(directory, "TI-0001.webp");
    const original = await readFile(file);
    try {
      const bytes = await sharp({
        create: { width: 400, height: 300, channels: 3, background: "red" },
      })
        .webp()
        .toBuffer();
      const candidate = structuredClone(manifest);
      const evidence = structuredClone(proof);
      candidate.entries[0].sha256 = createHash("sha256")
        .update(bytes)
        .digest("hex");
      evidence.files[0].sha256 = candidate.entries[0].sha256;
      evidence.files[0].bytes = bytes.length;
      await writeFile(file, bytes);
      await expect(
        validatePackage(directory, candidate, evidence),
      ).rejects.toThrow("dimensões divergentes");
    } finally {
      await writeFile(file, original);
    }
  });
});
