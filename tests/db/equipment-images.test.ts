import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { externalServiceFixtures, runPrisma, startTestDatabase } from "./setup";

const initial = "202610190001_initial";
const images = "202611060001_equipment_images";
type LocalDatabase = Awaited<ReturnType<typeof startTestDatabase>>;
let local: LocalDatabase;
let db: PrismaClient;
let migrationDir: string;
let legacy: Awaited<ReturnType<typeof equipmentFixture>>;
let metadata: { id: string };
const protectedObject = randomUUID();
const otherObject = randomUUID();

async function equipmentFixture(client: PrismaClient) {
  const tenant = await client.tenant.create({
    data: { slug: randomUUID(), name: "Fixture D04" },
  });
  const category = await client.equipmentCategory.create({
    data: { tenant_id: tenant.id, name: "Fixture" },
  });
  const equipment = await client.equipment.create({
    data: {
      tenant_id: tenant.id,
      category_id: category.id,
      name: "Equipamento de teste, não patrimônio real",
      asset_tag: "D04",
      pickup_location: "Fixture",
      operational_status: "MAINTENANCE",
      serial_number: "serial-fixture",
      description: "Preservar os campos existentes",
    },
  });
  return { tenant, equipment };
}

function imageData(
  fixture: Awaited<ReturnType<typeof equipmentFixture>>,
  overrides: Partial<Prisma.EquipmentImageUncheckedCreateInput> = {},
): Prisma.EquipmentImageUncheckedCreateInput {
  return {
    tenant_id: fixture.tenant.id,
    equipment_id: fixture.equipment.id,
    storage_bucket: "equipamentos",
    object_path: `${fixture.tenant.slug}/D04.webp`,
    source_provider: "Pixabay",
    source_id: 123n,
    source_author: "Autor fictício do teste",
    source_author_id: 456n,
    source_page_url: "https://pixabay.com/photos/fixture-123/",
    license_name: "Pixabay Content License",
    license_url: "https://pixabay.com/service/license-summary/",
    media_kind: "photo",
    mime_type: "image/webp",
    width: 800,
    height: 600,
    size_bytes: 4096,
    source_sha256: "a".repeat(64),
    sha256: "b".repeat(64),
    reviewed_at: new Date("2026-11-06T12:00:00Z"),
    reviewed_by: "Revisor fictício do teste",
    review_note: "Fixture sintética, não aprovação de imagem real",
    ...overrides,
  };
}

type ClientRole = "anon" | "authenticated";
function asClient<T>(
  role: ClientRole,
  run: (tx: Prisma.TransactionClient) => Promise<T>,
  grantImageAccess = false,
) {
  return db.$transaction(async (tx) => {
    if (grantImageAccess) {
      // Grants temporários para exercitar RLS em vez de testar somente REVOKE.
      await tx.$executeRawUnsafe(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_images TO "${role}"`,
      );
    }
    await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
    const result = await run(tx);
    if (grantImageAccess) {
      await tx.$executeRawUnsafe("RESET ROLE");
      await tx.$executeRawUnsafe(
        `REVOKE ALL ON public.equipment_images FROM "${role}"`,
      );
    }
    return result;
  });
}

beforeAll(async () => {
  local = await startTestDatabase(false);
  db = local.db;
  migrationDir = await mkdtemp(path.join(os.tmpdir(), "empresti-d04-"));
  await mkdir(path.join(migrationDir, "migrations", initial), {
    recursive: true,
  });
  await copyFile(
    "prisma/schema.prisma",
    path.join(migrationDir, "schema.prisma"),
  );
  await copyFile(
    "prisma/migrations/migration_lock.toml",
    path.join(migrationDir, "migrations/migration_lock.toml"),
  );
  await copyFile(
    `prisma/migrations/${initial}/migration.sql`,
    path.join(migrationDir, "migrations", initial, "migration.sql"),
  );
  // Primeiro aplica só a migration já existente, pelo Prisma Migrate.
  runPrisma(
    ["migrate", "deploy", "--schema", path.join(migrationDir, "schema.prisma")],
    local.url,
  );
  legacy = await equipmentFixture(db);
  await mkdir(path.join(migrationDir, "migrations", images));
  await copyFile(
    `prisma/migrations/${images}/migration.sql`,
    path.join(migrationDir, "migrations", images, "migration.sql"),
  );
  // Depois aplica a D04 sobre um banco que já contém um equipamento.
  runPrisma(
    ["migrate", "deploy", "--schema", path.join(migrationDir, "schema.prisma")],
    local.url,
  );

  // Policy deliberadamente ampla, somente na fixture, para desafiar o guard.
  await db.$executeRawUnsafe(
    "CREATE POLICY fixture_permissive_all ON storage.objects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true)",
  );
  await db.$executeRawUnsafe(
    "GRANT USAGE ON SCHEMA public, storage TO anon, authenticated",
  );
  await db.$executeRawUnsafe(
    "GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO anon, authenticated",
  );
  await db.$executeRaw`INSERT INTO storage.objects (id, bucket_id, name) VALUES
    (${protectedObject}::uuid, 'equipamentos', 'suporte_ti/fixture.webp'),
    (${otherObject}::uuid, 'outro', 'fixture.webp')`;
  const fixture = await equipmentFixture(db);
  metadata = await db.equipmentImage.create({ data: imageData(fixture) });
});

afterAll(async () => {
  await local?.db.$disconnect();
  await local?.container.stop();
  if (migrationDir) {
    // Único alvo de remoção recursiva: diretório temporário criado por este teste.
    if (
      path.dirname(path.resolve(migrationDir)) !== path.resolve(os.tmpdir()) ||
      !path.basename(migrationDir).startsWith("empresti-d04-")
    )
      throw new Error("Diretório de limpeza fora do alvo esperado.");
    await rm(migrationDir, { recursive: true, force: true });
  }
});

describe("D04 / CA-D01/CA-D03: referência opcional e integridade da imagem", () => {
  it("preserva equipamento anterior à D04 e permite continuar sem imagem", async () => {
    expect(
      await db.equipment.findUnique({ where: { id: legacy.equipment.id } }),
    ).toEqual(legacy.equipment);
    expect(
      await db.equipment.findUnique({
        where: { id: legacy.equipment.id },
        include: { image: true },
      }),
    ).toMatchObject({ image: null });
    const applied = await db.$queryRaw<
      { migration_name: string }[]
    >`SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL ORDER BY migration_name`;
    expect(applied.map((row) => row.migration_name)).toEqual([initial, images]);
  });

  it("reaplicar migrate deploy não recria objetos; colunas correspondem ao modelo Prisma", async () => {
    expect(runPrisma(["migrate", "deploy"], local.url)).toContain(
      "No pending migrations",
    );
    // A FK manual profiles -> auth.users impede o diff global do Prisma 6.
    // Conferir o catálogo real da tabela nova sem retirar essa proteção de Auth.
    const columns = await db.$queryRaw<
      { name: string; type: string; required: boolean }[]
    >`
      SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type,
             a.attnotnull AS required
      FROM pg_attribute a
      WHERE a.attrelid = 'public.equipment_images'::regclass
        AND a.attnum > 0 AND NOT a.attisdropped ORDER BY a.attname`;
    const model = Prisma.dmmf.datamodel.models.find(
      (item) => item.name === "EquipmentImage",
    )!;
    const uuid = ["id", "tenant_id", "equipment_id"];
    const types: Record<string, string> = {
      String: "text",
      BigInt: "bigint",
      Int: "integer",
      DateTime: "timestamp(6) with time zone",
    };
    const expected = model.fields
      .filter((field) => field.kind !== "object")
      .map((field) => ({
        name: field.dbName ?? field.name,
        type: uuid.includes(field.name) ? "uuid" : types[field.type],
        required: field.isRequired,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
    expect(columns).toEqual(expected);
    const indexes = await db.$queryRaw<
      { indexname: string }[]
    >`SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'equipment_images' ORDER BY indexname`;
    expect(indexes.map((row) => row.indexname)).toEqual([
      "equipment_images_equipment_key",
      "equipment_images_equipment_tenant_key",
      "equipment_images_object_key",
      "equipment_images_pkey",
      "equipment_images_tenant_idx",
    ]);
    const authReference = await db.$queryRaw<
      { target: string }[]
    >`SELECT confrelid::regclass::text AS target FROM pg_constraint WHERE conrelid = 'public.profiles'::regclass AND conname = 'profiles_auth_user_fkey'`;
    expect(authReference).toEqual([{ target: "auth.users" }]);
  });

  it("recusa segunda imagem, destino repetido e referência entre tenants", async () => {
    const a = await equipmentFixture(db);
    const b = await equipmentFixture(db);
    const row = await db.equipmentImage.create({ data: imageData(a) });
    expect(
      (
        await db.equipment.findUnique({
          where: { id: a.equipment.id },
          include: { image: true },
        })
      )?.image?.id,
    ).toBe(row.id);
    await expect(
      db.equipmentImage.create({
        data: imageData(a, { object_path: `${a.tenant.slug}/outra.webp` }),
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expect(
      db.equipmentImage.create({
        data: imageData(b, { object_path: row.object_path }),
      }),
    ).rejects.toMatchObject({ code: "P2002" });
    await expect(
      db.equipmentImage.create({
        data: imageData(b, { tenant_id: a.tenant.id }),
      }),
    ).rejects.toMatchObject({ code: "P2003" });
    // A mesma foto pública pode ser usada por outro tenant, em outro destino.
    await expect(
      db.equipmentImage.create({ data: imageData(b) }),
    ).resolves.toMatchObject({ source_id: 123n });
  });

  const invalid: [
    Partial<Prisma.EquipmentImageUncheckedCreateInput>,
    string,
  ][] = [
    [{ storage_bucket: "outro" }, "destination"],
    [{ object_path: " " }, "destination"],
    [{ object_path: "/absoluto.webp" }, "destination"],
    [{ object_path: "tenant/../escape.webp" }, "destination"],
    [{ object_path: "tenant/./escape.webp" }, "destination"],
    [{ object_path: "tenant//escape.webp" }, "destination"],
    [{ object_path: "tenant\\escape.webp" }, "destination"],
    [{ object_path: "tenant/a.webp?key=ficticia" }, "destination"],
    [{ object_path: "tenant/a.webp#fragmento" }, "destination"],
    [{ object_path: "tenant/a.png" }, "destination"],
    [{ source_provider: "Outro" }, "source"],
    [{ source_id: 0n }, "source"],
    [{ source_author_id: 0n }, "source"],
    [{ source_author: " " }, "source"],
    [{ source_page_url: "https://example.com/photo/1/" }, "source"],
    [
      { source_page_url: "https://pixabay.com/photos/a/?key=ficticia" },
      "source",
    ],
    [{ license_name: "Outra" }, "source"],
    [{ license_url: "https://example.com/license" }, "source"],
    [{ media_kind: "vector" }, "format"],
    [{ mime_type: "image/jpeg" }, "format"],
    [{ width: 801 }, "format"],
    [{ height: 599 }, "format"],
    [{ size_bytes: 0 }, "format"],
    [{ size_bytes: 1048577 }, "format"],
    [{ source_sha256: "invalido" }, "hashes"],
    [{ sha256: "A".repeat(64) }, "hashes"],
    [{ reviewed_by: " " }, "review"],
    [{ review_note: " " }, "review"],
  ];
  it.each(
    invalid.map(([patch, constraint], index) => ({
      label: `${index + 1}: ${Object.keys(patch)[0]} / ${constraint}`,
      patch,
      constraint,
    })),
  )("recusa metadado inválido $label", async ({ patch, constraint }) => {
    const fixture = await equipmentFixture(db);
    await expect(
      db.equipmentImage.create({ data: imageData(fixture, patch) }),
    ).rejects.toThrow(`equipment_images_${constraint}`);
  });

  it("aceita ilustração identificada, limite de tamanho e desativação sem DELETE físico", async () => {
    const fixture = await equipmentFixture(db);
    const row = await db.equipmentImage.create({
      data: imageData(fixture, {
        media_kind: "illustration",
        source_page_url: "https://pixabay.com/illustrations/fixture-123/",
        size_bytes: 1048576,
      }),
    });
    const deactivated = await db.equipmentImage.update({
      where: { id: row.id },
      data: { deactivated_at: new Date() },
    });
    expect(deactivated.deactivated_at).not.toBeNull();
    await expect(
      db.equipmentImage.delete({ where: { id: row.id } }),
    ).rejects.toThrow("physical deletion is disabled");
    await expect(
      db.$executeRaw`UPDATE equipment_images SET source_author = NULL WHERE id = ${row.id}::uuid`,
    ).rejects.toMatchObject({ code: "P2010", meta: { code: "23502" } });
    expect(await db.equipmentImage.count({ where: { id: row.id } })).toBe(1);
  });
});

describe.each<ClientRole>(["anon", "authenticated"])(
  "D04 / CA-D05: acesso direto como %s",
  (role) => {
    it("é papel sem owner/bypass e não possui privilégio direto nos metadados", async () => {
      const rows = await db.$queryRaw<
        {
          rolsuper: boolean;
          rolbypassrls: boolean;
          owner: boolean;
          can_select: boolean;
        }[]
      >`SELECT r.rolsuper, r.rolbypassrls, c.relowner = r.oid AS owner, has_table_privilege(r.rolname, c.oid, 'SELECT') AS can_select FROM pg_roles r CROSS JOIN pg_class c WHERE r.rolname = ${role} AND c.oid = 'public.equipment_images'::regclass`;
      expect(rows).toEqual([
        {
          rolsuper: false,
          rolbypassrls: false,
          owner: false,
          can_select: false,
        },
      ]);
      await expect(
        asClient(role, (tx) => tx.$queryRaw`SELECT id FROM equipment_images`),
      ).rejects.toThrow("permission denied");
    });

    it("RLS bloqueia metadados mesmo após grant temporário de teste", async () => {
      expect(
        await asClient(role, (tx) => tx.equipmentImage.findMany(), true),
      ).toEqual([]);
      const fixture = await equipmentFixture(db);
      await expect(
        asClient(
          role,
          (tx) => tx.equipmentImage.create({ data: imageData(fixture) }),
          true,
        ),
      ).rejects.toThrow("row-level security");
      expect(
        await asClient(
          role,
          (tx) =>
            tx.equipmentImage.updateMany({
              where: { id: metadata.id },
              data: { review_note: "Não pode alterar" },
            }),
          true,
        ),
      ).toEqual({ count: 0 });
      expect(
        await asClient(
          role,
          (tx) => tx.equipmentImage.deleteMany({ where: { id: metadata.id } }),
          true,
        ),
      ).toEqual({ count: 0 });
    });

    it("guard vence policy ampla e preserva as permissões de outro bucket", async () => {
      expect(
        await asClient(
          role,
          (tx) =>
            tx.$queryRaw`SELECT id FROM storage.objects WHERE bucket_id = 'equipamentos'`,
        ),
      ).toEqual([]);
      await expect(
        asClient(
          role,
          (tx) =>
            tx.$executeRaw`INSERT INTO storage.objects (id, bucket_id, name) VALUES (${randomUUID()}::uuid, 'equipamentos', 'bloqueado.webp')`,
        ),
      ).rejects.toThrow("row-level security");
      expect(
        await asClient(
          role,
          (tx) =>
            tx.$executeRaw`UPDATE storage.objects SET name = 'alterado.webp' WHERE id = ${protectedObject}::uuid`,
        ),
      ).toBe(0);
      expect(
        await asClient(
          role,
          (tx) =>
            tx.$executeRaw`DELETE FROM storage.objects WHERE id = ${protectedObject}::uuid`,
        ),
      ).toBe(0);
      await expect(
        asClient(
          role,
          (tx) =>
            tx.$executeRaw`UPDATE storage.objects SET bucket_id = 'equipamentos' WHERE id = ${otherObject}::uuid`,
        ),
      ).rejects.toThrow("row-level security");
      expect(
        await asClient(
          role,
          (tx) =>
            tx.$executeRaw`INSERT INTO storage.objects (id, bucket_id, name) SELECT gen_random_uuid(), 'outro', name FROM storage.objects WHERE id = ${protectedObject}::uuid`,
        ),
      ).toBe(0);
      expect(
        await asClient(
          role,
          (tx) =>
            tx.$queryRaw`SELECT id FROM storage.objects WHERE id = ${otherObject}::uuid`,
        ),
      ).toEqual([{ id: otherObject }]);
      expect(
        await asClient(
          role,
          (tx) =>
            tx.$executeRaw`INSERT INTO storage.objects (id, bucket_id, name) VALUES (${randomUUID()}::uuid, 'outro', 'permitido.webp')`,
        ),
      ).toBe(1);
      const protectedRows = await db.$queryRaw<
        { name: string }[]
      >`SELECT name FROM storage.objects WHERE id = ${protectedObject}::uuid`;
      expect(protectedRows).toEqual([{ name: "suporte_ti/fixture.webp" }]);
    });

    it("controle negativo: retirar o guard só na transação expõe o objeto", async () => {
      const rollback = new Error("Rollback intencional do controle negativo");
      await expect(
        db.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(
            "DROP POLICY equipment_objects_block_app_clients ON storage.objects",
          );
          await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
          expect(
            await tx.$queryRaw`SELECT id FROM storage.objects WHERE id = ${protectedObject}::uuid`,
          ).toEqual([{ id: protectedObject }]);
          expect(
            await tx.$executeRaw`UPDATE storage.objects SET name = 'exposto.webp' WHERE id = ${protectedObject}::uuid`,
          ).toBe(1);
          expect(
            await tx.$executeRaw`INSERT INTO storage.objects (id, bucket_id, name) VALUES (${randomUUID()}::uuid, 'equipamentos', 'exposto.webp')`,
          ).toBe(1);
          expect(
            await tx.$executeRaw`DELETE FROM storage.objects WHERE id = ${protectedObject}::uuid`,
          ).toBe(1);
          throw rollback;
        }),
      ).rejects.toBe(rollback);
      expect(
        await asClient(
          role,
          (tx) =>
            tx.$queryRaw`SELECT id FROM storage.objects WHERE bucket_id = 'equipamentos'`,
        ),
      ).toEqual([]);
    });
  },
);

describe("D04 / CA-D05: pré-condições do serviço", () => {
  it.each(["missing", "disabled"] as const)(
    "falha sem deixar tabela parcial quando Storage está %s",
    async (storage) => {
      const name = `fixture_storage_${storage}`;
      await db.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
      const parsed = new URL(local.url);
      parsed.pathname = `/${name}`;
      const url = parsed.href;
      const isolated = new PrismaClient({ datasourceUrl: url });
      try {
        await externalServiceFixtures(isolated, storage);
        let failed = false;
        try {
          runPrisma(["migrate", "deploy"], url);
        } catch (error) {
          const result = error as { stdout?: Buffer; stderr?: Buffer };
          expect(`${result.stdout ?? ""}${result.stderr ?? ""}`).toContain(
            storage === "missing"
              ? "Storage deve estar provisionado"
              : "RLS do Storage precisa estar habilitado",
          );
          failed = true;
        }
        expect(failed).toBe(true);
        expect(
          await isolated.$queryRaw`SELECT to_regclass('public.equipment_images')::text AS name`,
        ).toEqual([{ name: null }]);
      } finally {
        await isolated.$disconnect();
      }
    },
  );
});
