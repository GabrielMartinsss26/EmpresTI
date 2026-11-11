import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { copyFile, mkdir, mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  startTestDatabase,
  externalServiceFixtures,
  runPrisma,
  assertLocalDatabase,
} from "./setup";

const initial = "202610190001_initial";
const images = "202611060001_equipment_images";
const dueRules = "202611090001_loan_due_rules";
let local: Awaited<ReturnType<typeof startTestDatabase>>;
let directory: string;
let db: PrismaClient;
let oldLoans: { id: string; record: Prisma.JsonValue }[];
let legacyActive: Awaited<ReturnType<typeof prepare>>;
let legacyReturned: Awaited<ReturnType<typeof prepare>>;

async function historyDirectory() {
  const root = await mkdtemp(path.join(os.tmpdir(), "empresti-e01-"));
  await copyFile("prisma/schema.prisma", path.join(root, "schema.prisma"));
  await mkdir(path.join(root, "migrations"));
  await copyFile(
    "prisma/migrations/migration_lock.toml",
    path.join(root, "migrations/migration_lock.toml"),
  );
  for (const name of [initial, images]) {
    await mkdir(path.join(root, "migrations", name));
    await copyFile(
      `prisma/migrations/${name}/migration.sql`,
      path.join(root, "migrations", name, "migration.sql"),
    );
  }
  return root;
}
async function addMigration(root: string) {
  await mkdir(path.join(root, "migrations", dueRules));
  await copyFile(
    `prisma/migrations/${dueRules}/migration.sql`,
    path.join(root, "migrations", dueRules, "migration.sql"),
  );
}
function deploy(root: string, url: string) {
  return runPrisma(
    ["migrate", "deploy", "--schema", path.join(root, "schema.prisma")],
    url,
  );
}
async function cleanup(root: string) {
  if (
    path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir()) ||
    !path.basename(root).startsWith("empresti-e01-")
  )
    throw new Error("Alvo temporário inválido.");
  await rm(root, { recursive: true, force: true });
}

async function prepare(
  client: PrismaClient,
  start = "2026-11-09T13:00:00.000000Z",
) {
  const tenant = await client.tenant.create({
    data: { slug: randomUUID(), name: "Fixture E01" },
  });
  const borrowerId = randomUUID(),
    operatorId = randomUUID();
  await client.$executeRaw`INSERT INTO auth.users (id) VALUES (${borrowerId}::uuid), (${operatorId}::uuid)`;
  await client.profile.createMany({
    data: [
      { id: borrowerId, full_name: "Pessoa fixture" },
      { id: operatorId, full_name: "Operações fixture" },
    ],
  });
  const borrower = await client.membership.create({
    data: { tenant_id: tenant.id, user_id: borrowerId, role: "COLLABORATOR" },
  });
  const operator = await client.membership.create({
    data: { tenant_id: tenant.id, user_id: operatorId, role: "OPERATIONS" },
  });
  const category = await client.equipmentCategory.create({
    data: { tenant_id: tenant.id, name: "Fixture E01" },
  });
  const equipment = await client.equipment.create({
    data: {
      tenant_id: tenant.id,
      category_id: category.id,
      name: "Fixture E01",
      asset_tag: randomUUID(),
      pickup_location: "Fixture",
    },
  });
  const requestId = randomUUID(),
    loanId = randomUUID();
  // Raw aqui preserva microssegundos e funciona antes do campo due_rule existir.
  await client.$executeRaw`INSERT INTO loan_requests
    (id, tenant_id, equipment_id, requester_membership_id, status, requested_at, decided_at, decided_by_membership_id, created_at, updated_at)
    VALUES (${requestId}::uuid, ${tenant.id}::uuid, ${equipment.id}::uuid, ${borrower.id}::uuid, 'APPROVED',
      ${start}::timestamptz, ${start}::timestamptz, ${operator.id}::uuid, ${start}::timestamptz, ${start}::timestamptz)`;
  return { tenant, borrower, operator, equipment, requestId, loanId, start };
}

async function insert(
  client: Prisma.TransactionClient,
  fixture: Awaited<ReturnType<typeof prepare>>,
  due: string | null,
  rule?: "LEGACY_CALENDAR_14" | "BUSINESS_14_SP",
) {
  const column = rule ? Prisma.sql`, due_rule` : Prisma.empty;
  const value = rule
    ? Prisma.sql`, ${rule}::public."LoanDueRule"`
    : Prisma.empty;
  return client.$executeRaw(Prisma.sql`INSERT INTO loans
    (id, tenant_id, loan_request_id, equipment_id, borrower_membership_id, approved_by_membership_id, checked_out_at, due_at, created_at, updated_at${column})
    VALUES (${fixture.loanId}::uuid, ${fixture.tenant.id}::uuid, ${fixture.requestId}::uuid, ${fixture.equipment.id}::uuid,
      ${fixture.borrower.id}::uuid, ${fixture.operator.id}::uuid, ${fixture.start}::timestamptz, ${due}::timestamptz,
      ${fixture.start}::timestamptz, ${fixture.start}::timestamptz${value})`);
}

async function legacySnapshot(client: PrismaClient) {
  return client.$queryRaw<
    { id: string; record: Prisma.JsonValue }[]
  >`SELECT id, to_jsonb(l) - 'due_rule' AS record FROM loans l ORDER BY id`;
}

beforeAll(async () => {
  local = await startTestDatabase(false);
  db = local.db;
  directory = await historyDirectory();
  deploy(directory, local.url);
  legacyActive = await prepare(db, "2026-11-06T13:00:00.123456Z");
  legacyReturned = await prepare(db, "2026-11-05T13:00:00.654321Z");
  await insert(db, legacyActive, "2026-11-20T13:00:00.123456Z");
  await insert(db, legacyReturned, "2026-11-19T13:00:00.654321Z");
  await db.$executeRaw`UPDATE loans SET returned_at = '2026-11-07T13:00:00Z', returned_by_membership_id = ${legacyReturned.operator.id}::uuid WHERE id = ${legacyReturned.loanId}::uuid`;
  oldLoans = await legacySnapshot(db);
  await addMigration(directory);
  deploy(directory, local.url);
});
afterAll(async () => {
  await local?.db.$disconnect();
  await local?.container.stop();
  if (directory) await cleanup(directory);
});

describe("E01 · CA-E12 — upgrade e regra de vencimento", () => {
  it("preserva integralmente os dois empréstimos anteriores, inclusive microssegundos, acrescentando só a versão legada", async () => {
    expect(await legacySnapshot(db)).toEqual(oldLoans);
    const rows = await db.loan.findMany();
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.due_rule === "LEGACY_CALENDAR_14")).toBe(true);
    const constraints = await db.$queryRaw<
      { conname: string; convalidated: boolean }[]
    >`SELECT conname, convalidated FROM pg_constraint WHERE conrelid = 'public.loans'::regclass`;
    expect(constraints.some((c) => c.conname === "loan_due_14_days")).toBe(
      false,
    );
    expect(
      constraints.find((c) => c.conname === "loans_due_by_rule")?.convalidated,
    ).toBe(true);
  });

  it("permite solicitar/confirmar devolução do legado sem mudar suas datas ou regra", async () => {
    const before = await db.loan.findUniqueOrThrow({
      where: { id: legacyActive.loanId },
    });
    await db.loan.update({
      where: { id: before.id },
      data: { return_requested_at: new Date("2026-11-10T13:00:00Z") },
    });
    const returned = await db.loan.update({
      where: { id: before.id },
      data: {
        returned_at: new Date("2026-11-11T13:00:00Z"),
        returned_by_membership_id: legacyActive.operator.id,
      },
    });
    expect(returned).toMatchObject({
      checked_out_at: before.checked_out_at,
      due_at: before.due_at,
      due_rule: before.due_rule,
    });
  });

  it("default novo exige dias úteis, sem permitir 14 corridos ou regra legada explícita", async () => {
    const fixture = await prepare(db);
    await expect(insert(db, fixture, "2026-11-23T13:00:00Z")).rejects.toThrow(
      "loans_due_by_rule",
    );
    await expect(
      insert(db, fixture, "2026-11-23T13:00:00Z", "LEGACY_CALENDAR_14"),
    ).rejects.toThrow("new loans must use");
    expect(await insert(db, fixture, "2026-11-27T13:00:00Z")).toBe(1);
    expect(
      (await db.loan.findUniqueOrThrow({ where: { id: fixture.loanId } }))
        .due_rule,
    ).toBe("BUSINESS_14_SP");
  });

  it.each(["checked_out_at", "due_at", "due_rule"] as const)(
    "impede alterar %s de legado ou novo, com rollback dos demais campos",
    async (field) => {
      const fixture = await prepare(db);
      await insert(db, fixture, "2026-11-27T13:00:00Z");
      for (const id of [legacyReturned.loanId, fixture.loanId]) {
        const before = await db.loan.findUniqueOrThrow({ where: { id } });
        const data =
          field === "due_rule"
            ? {
                due_rule:
                  before.due_rule === "BUSINESS_14_SP"
                    ? ("LEGACY_CALENDAR_14" as const)
                    : ("BUSINESS_14_SP" as const),
              }
            : { [field]: new Date("2027-01-01T13:00:00Z") };
        await expect(db.loan.update({ where: { id }, data })).rejects.toThrow(
          "immutable",
        );
        expect(await db.loan.findUniqueOrThrow({ where: { id } })).toEqual(
          before,
        );
      }
    },
  );

  it("continua exigindo uma solicitação aprovada correspondente", async () => {
    const fixture = await prepare(db);
    await db.loanRequest.update({
      where: { id: fixture.requestId },
      data: {
        status: "PENDING",
        decided_at: null,
        decided_by_membership_id: null,
      },
    });
    await expect(insert(db, fixture, "2026-11-27T13:00:00Z")).rejects.toThrow(
      "loan must match its approved request",
    );
  });

  it("controle negativo demonstra o bypass sem guard e rollback restaura a proteção", async () => {
    const fixture = await prepare(db);
    await expect(
      db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
          "ALTER TABLE public.loans DISABLE TRIGGER loans_guard_due_rule",
        );
        expect(
          await insert(
            tx,
            fixture,
            "2026-11-23T13:00:00Z",
            "LEGACY_CALENDAR_14",
          ),
        ).toBe(1);
        throw new Error("rollback intencional do controle negativo");
      }),
    ).rejects.toThrow("rollback intencional");
    expect(
      await db.loan.findUnique({ where: { id: fixture.loanId } }),
    ).toBeNull();
    await expect(
      insert(db, fixture, "2026-11-23T13:00:00Z", "LEGACY_CALENDAR_14"),
    ).rejects.toThrow("new loans must use");
  });

  it("migrate deploy repetido não reaplica SQL e preserva os registros", async () => {
    const before = await db.loan.findMany({ orderBy: { id: "asc" } });
    expect(deploy(directory, local.url)).toContain("No pending migrations");
    expect(await db.loan.findMany({ orderBy: { id: "asc" } })).toEqual(before);
  });
});

describe("E01 · base CA-E07 — expectativas fixas de calendário SQL", () => {
  it.each([
    ["segunda", "2026-11-09T13:00:00Z", "2026-11-27T13:00:00.000Z"],
    ["sexta", "2026-11-06T13:00:00Z", "2026-11-26T13:00:00.000Z"],
    ["sábado", "2026-11-07T13:00:00Z", "2026-11-26T13:00:00.000Z"],
    ["domingo", "2026-11-08T13:00:00Z", "2026-11-26T13:00:00.000Z"],
    ["mês", "2026-11-30T23:30:00Z", "2026-12-18T23:30:00.000Z"],
    [
      "ano sem descontar feriados",
      "2026-12-21T13:00:00Z",
      "2027-01-08T13:00:00.000Z",
    ],
    [
      "virada UTC sem virada local",
      "2026-11-10T01:30:00Z",
      "2026-11-28T01:30:00.000Z",
    ],
  ])(
    "%s mantém horário local e exclui o dia da aprovação",
    async (_name, start, expected) => {
      const rows = await db.$queryRaw<
        { due: Date }[]
      >`SELECT public.loan_due_14_business_days_v1(${start}::timestamptz) AS due`;
      expect(rows[0].due.toISOString()).toBe(expected);
    },
  );

  it.each(["UTC", "Asia/Tokyo", "America/Sao_Paulo"])(
    "mesmo instante final com sessão em %s e precisão de microssegundos",
    async (zone) => {
      const rows = await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT set_config('TimeZone', ${zone}, true)`;
        return tx.$queryRaw<
          { due: string }[]
        >`SELECT to_char(public.loan_due_14_business_days_v1('2026-11-09T13:00:00.123456Z'::timestamptz) AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.US') AS due`;
      });
      expect(rows[0].due).toBe("2026-11-27 13:00:00.123456");
    },
  );

  it.each(["infinity", "-infinity"])(
    "rejeita instante %s sem entrar em loop",
    async (value) => {
      await expect(
        db.$queryRaw`SELECT public.loan_due_14_business_days_v1(${value}::timestamptz)`,
      ).rejects.toThrow("loan start must be finite");
    },
  );
  it("STRICT devolve NULL ao cálculo puro, mas vencimento NULL não pode ser inserido", async () => {
    expect(
      await db.$queryRaw`SELECT public.loan_due_14_business_days_v1(NULL) AS due`,
    ).toEqual([{ due: null }]);
    await expect(insert(db, await prepare(db), null)).rejects.toThrow();
  });
});

describe("E01 · CA-E12 — privilégios e falhas atômicas", () => {
  it.each(["anon", "authenticated"])(
    "%s não executa funções nem obtém acesso adicional",
    async (role) => {
      for (const expression of [
        "public.loan_due_14_business_days_v1(now())",
        "public.guard_loan_due_rule_v1()",
      ]) {
        await expect(
          db.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
            return tx.$queryRawUnsafe(`SELECT ${expression}`);
          }),
        ).rejects.toThrow("permission denied for function");
      }
    },
  );

  it("funções são invoker, calendário imutável/strict e RLS/índices/triggers anteriores permanecem", async () => {
    const functions = await db.$queryRaw<
      {
        proname: string;
        prosecdef: boolean;
        provolatile: string;
        proisstrict: boolean;
      }[]
    >`SELECT proname, prosecdef, provolatile::text, proisstrict FROM pg_proc WHERE oid IN ('public.loan_due_14_business_days_v1(timestamptz)'::regprocedure, 'public.guard_loan_due_rule_v1()'::regprocedure)`;
    expect(functions.every((f) => !f.prosecdef)).toBe(true);
    expect(
      functions.find((f) => f.proname === "loan_due_14_business_days_v1"),
    ).toMatchObject({ provolatile: "i", proisstrict: true });
    expect(
      await db.$queryRaw`SELECT relrowsecurity FROM pg_class WHERE oid = 'public.loans'::regclass`,
    ).toEqual([{ relrowsecurity: true }]);
    const triggers = await db.$queryRaw<
      { tgname: string }[]
    >`SELECT tgname FROM pg_trigger WHERE tgrelid = 'public.loans'::regclass AND NOT tgisinternal`;
    expect(triggers.map((t) => t.tgname)).toEqual(
      expect.arrayContaining([
        "loans_guard_due_rule",
        "loans_match_approved_request",
        "preserve_history",
      ]),
    );
    const indexes = await db.$queryRaw<
      { indexname: string }[]
    >`SELECT indexname FROM pg_indexes WHERE tablename = 'loans'`;
    expect(indexes.map((i) => i.indexname)).toContain(
      "loans_one_active_equipment",
    );
  });

  it.each(["DDL tardio", "lock indisponível"])(
    "%s falha sem deixar enum/coluna/função ou alterar legado",
    async (scenario) => {
      const name = `e01_${randomUUID().replaceAll("-", "")}`;
      await db.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
      const url = new URL(local.url);
      url.pathname = `/${name}`;
      assertLocalDatabase(url.href);
      const client = new PrismaClient({ datasourceUrl: url.href });
      const root = await historyDirectory();
      try {
        await externalServiceFixtures(client);
        deploy(root, url.href);
        const fixture = await prepare(client);
        await insert(client, fixture, "2026-11-23T13:00:00Z");
        const before = await legacySnapshot(client);
        if (scenario === "DDL tardio")
          await client.$executeRawUnsafe(
            "CREATE FUNCTION public.guard_loan_due_rule_v1() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END $$",
          );
        await addMigration(root);
        if (scenario === "lock indisponível") {
          let release!: () => void, signal!: () => void;
          const gate = new Promise<void>((resolve) => {
            release = resolve;
          });
          const locked = new Promise<void>((resolve) => {
            signal = resolve;
          });
          const blocker = client.$transaction(
            async (tx) => {
              await tx.$queryRaw`SELECT id FROM loans LIMIT 0`;
              signal();
              await gate;
            },
            { timeout: 45_000 },
          );
          await locked;
          try {
            expect(() => deploy(root, url.href)).toThrow(/lock timeout/i);
          } finally {
            release();
            await blocker;
          }
        } else expect(() => deploy(root, url.href)).toThrow(/already exists/i);
        expect(await legacySnapshot(client)).toEqual(before);
        expect(
          await client.$queryRaw`SELECT to_regtype('public."LoanDueRule"')::text AS enum, to_regprocedure('public.loan_due_14_business_days_v1(timestamptz)')::text AS calculation`,
        ).toEqual([{ enum: null, calculation: null }]);
        expect(
          await client.$queryRaw`SELECT attname FROM pg_attribute WHERE attrelid = 'public.loans'::regclass AND attname = 'due_rule' AND NOT attisdropped`,
        ).toEqual([]);
        expect(
          await client.$queryRaw`SELECT conname FROM pg_constraint WHERE conrelid = 'public.loans'::regclass AND conname = 'loan_due_14_days'`,
        ).toEqual([{ conname: "loan_due_14_days" }]);
      } finally {
        await client.$disconnect();
        await cleanup(root);
      }
    },
  );

  it("SQL aplicado corresponde ao bloco aprovado", async () => {
    const proposal = (
      await readFile(
        "docs/specs/005-solicitar-emprestimo/proposta-e01.md",
        "utf8",
      )
    ).replaceAll("\r\n", "\n");
    expect(
      (await readFile(`prisma/migrations/${dueRules}/migration.sql`, "utf8"))
        .replaceAll("\r\n", "\n")
        .trim(),
    ).toBe(proposal.match(/```sql\n([\s\S]*?)\n```/)?.[1]);
  });
});
