import { beforeAll, afterAll, describe, expect, it } from "vitest";
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

let container: StartedPostgreSqlContainer;
let db: PrismaClient;
beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
  const url = container.getConnectionUri();
  db = new PrismaClient({ datasourceUrl: url });
  // Infraestrutura externa do Supabase simulada somente no PostgreSQL local.
  await db.$executeRawUnsafe("CREATE SCHEMA auth");
  await db.$executeRawUnsafe("CREATE TABLE auth.users (id uuid PRIMARY KEY)");
  execFileSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      stdio: "pipe",
    },
  );
  execFileSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"],
    {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      stdio: "pipe",
    },
  );
  execFileSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "prisma/seed.ts"],
    {
      env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
      stdio: "pipe",
    },
  );
});
afterAll(async () => {
  await db?.$disconnect();
  await container?.stop();
});

describe("migration inicial em banco vazio", () => {
  it("seed é idempotente e todas as nove tabelas têm RLS e policy", async () => {
    expect(await db.tenant.count({ where: { slug: "suporte_ti" } })).toBe(1);
    const tables = await db.$queryRaw<
      { relname: string; relrowsecurity: boolean }[]
    >`SELECT relname, relrowsecurity FROM pg_class JOIN pg_namespace n ON n.oid = relnamespace WHERE n.nspname = 'public' AND relkind = 'r' AND relname <> '_prisma_migrations'`;
    expect(tables).toHaveLength(9);
    expect(tables.every((table) => table.relrowsecurity)).toBe(true);
    const policies = await db.$queryRaw<
      { tablename: string }[]
    >`SELECT tablename FROM pg_policies WHERE schemaname = 'public'`;
    expect(policies).toHaveLength(9);
  });

  it("bloqueia leitura e escrita direta para role sem privilégio de owner", async () => {
    await db.$executeRawUnsafe("CREATE ROLE app_reader NOLOGIN");
    await db.$executeRawUnsafe("GRANT USAGE ON SCHEMA public TO app_reader");
    await db.$executeRawUnsafe(
      "GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO app_reader",
    );
    const rows = await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe("SET LOCAL ROLE app_reader");
      return tx.$queryRaw`SELECT id FROM tenants`;
    });
    expect(rows).toEqual([]);
    await expect(
      db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL ROLE app_reader");
        return tx.$executeRawUnsafe(
          "INSERT INTO tenants (id, slug, name, updated_at) VALUES (gen_random_uuid(), 'blocked', 'blocked', now())",
        );
      }),
    ).rejects.toThrow();
  });

  it("impede referência entre tenants e patrimônio repetido no mesmo tenant", async () => {
    const a = await db.tenant.create({ data: { slug: "a", name: "A" } });
    const b = await db.tenant.create({ data: { slug: "b", name: "B" } });
    const category = await db.equipmentCategory.create({
      data: { tenant_id: a.id, name: "Notebooks" },
    });
    await expect(
      db.equipment.create({
        data: {
          tenant_id: b.id,
          category_id: category.id,
          name: "Inválido",
          asset_tag: "A1",
          pickup_location: "Balcão",
        },
      }),
    ).rejects.toThrow();
    const data = {
      tenant_id: a.id,
      category_id: category.id,
      name: "Notebook",
      asset_tag: "A1",
      pickup_location: "Balcão",
    };
    await db.equipment.create({ data });
    await expect(db.equipment.create({ data })).rejects.toThrow();
    await db.equipment.create({
      data: { ...data, asset_tag: "A2", serial_number: null },
    });
  });

  it("preserva auditoria e impede exclusão física de cadastro", async () => {
    const tenant = await db.tenant.findUniqueOrThrow({
      where: { slug: "suporte_ti" },
    });
    const audit = await db.auditLog.create({
      data: { tenant_id: tenant.id, action: "test", resource_type: "tenant" },
    });
    await expect(
      db.auditLog.update({
        where: { id: audit.id },
        data: { action: "changed" },
      }),
    ).rejects.toThrow();
    await expect(
      db.auditLog.delete({ where: { id: audit.id } }),
    ).rejects.toThrow();
    await expect(
      db.tenant.delete({ where: { id: tenant.id } }),
    ).rejects.toThrow();
  });

  it("impede solicitações pendentes duplicadas e rejeição sem motivo", async () => {
    const tenant = await db.tenant.findUniqueOrThrow({
      where: { slug: "suporte_ti" },
    });
    const userId = randomUUID();
    await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${userId}::uuid)`;
    await db.profile.create({ data: { id: userId, full_name: "Teste local" } });
    const membership = await db.membership.create({
      data: { tenant_id: tenant.id, user_id: userId, role: "COLLABORATOR" },
    });
    const category = await db.equipmentCategory.create({
      data: { tenant_id: tenant.id, name: "Teste" },
    });
    const equipment = await db.equipment.create({
      data: {
        tenant_id: tenant.id,
        category_id: category.id,
        name: "Teste",
        asset_tag: "T1",
        pickup_location: "Balcão",
      },
    });
    const data = {
      tenant_id: tenant.id,
      equipment_id: equipment.id,
      requester_membership_id: membership.id,
    };
    const request = await db.loanRequest.create({ data });
    await expect(db.loanRequest.create({ data })).rejects.toThrow();
    await expect(
      db.loanRequest.update({
        where: { id: request.id },
        data: {
          status: "REJECTED",
          decided_at: new Date(),
          decided_by_membership_id: membership.id,
        },
      }),
    ).rejects.toThrow();
  });

  it("versiona segurança junto da migration e não depende de SQL remoto manual", () => {
    const sql = readFileSync(
      "prisma/migrations/202610190001_initial/migration.sql",
      "utf8",
    );
    expect(sql).toContain("CREATE POLICY");
    expect(sql).toContain("CREATE TRIGGER");
    expect(sql).toContain("loans_one_active_equipment");
  });
});
