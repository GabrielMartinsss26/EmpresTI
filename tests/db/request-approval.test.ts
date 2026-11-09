import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Membership, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import superjson from "superjson";
import { startTestDatabase } from "./setup";
vi.mock("server-only", () => ({}));
vi.mock("../../src/server/db", () => ({ db: {} }));
vi.mock("../../src/server/auth", () => ({ createAuthClient: vi.fn() }));
vi.mock("../../src/server/services/login", () => ({ login: vi.fn() }));
import { appRouter } from "../../src/server/api/root";
import type { createContext } from "../../src/server/api/trpc";
import { approveRequest } from "../../src/server/services/request-approval";
import { createRequest } from "../../src/server/services/requests";
import { calculateLoanDueAt } from "../../src/server/services/loan-due-date";

let local: Awaited<ReturnType<typeof startTestDatabase>>;
let db: PrismaClient;
beforeAll(async () => {
  local = await startTestDatabase();
  db = local.db;
});
afterAll(async () => {
  await db?.$disconnect();
  await local?.container.stop();
});
type Context = Awaited<ReturnType<typeof createContext>>;
function context(
  member: Membership | null,
  userId: string | null = member?.user_id ?? null,
): Context {
  return {
    db,
    user: userId ? { id: userId } : null,
    membership: member,
    headers: new Headers(),
    auth: {},
  } as Context;
}
function api(member: Membership | null, userId?: string | null) {
  return appRouter.createCaller(context(member, userId));
}
function reader(member: Membership) {
  return {
    db,
    tenantId: member.tenant_id,
    membershipId: member.id,
    userId: member.user_id,
  };
}
async function person(tenantId: string, role: Membership["role"]) {
  const id = randomUUID();
  await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${id}::uuid)`;
  await db.profile.create({ data: { id, full_name: "Pessoa sintética E05" } });
  return db.membership.create({
    data: { tenant_id: tenantId, user_id: id, role },
  });
}
async function fixture(role: Membership["role"] = "OPERATIONS") {
  const tenant = await db.tenant.create({
    data: { slug: randomUUID(), name: "Fixture E05" },
  });
  const own = await person(tenant.id, "COLLABORATOR"),
    other = await person(tenant.id, "COLLABORATOR");
  const operator = await person(tenant.id, role),
    secondOperator = await person(tenant.id, "ADMIN");
  const category = await db.equipmentCategory.create({
    data: { tenant_id: tenant.id, name: "Fixture" },
  });
  async function item() {
    return db.equipment.create({
      data: {
        tenant_id: tenant.id,
        category_id: category.id,
        asset_tag: randomUUID(),
        name: "Equipamento sintético",
        pickup_location: "Operações",
      },
    });
  }
  async function pending(member = own, time = "2026-11-01T13:00:00Z") {
    const equipment = await item();
    return createRequest(reader(member), equipment.id, () => new Date(time));
  }
  async function existing(
    member = own,
    start = "2100-01-04T13:00:00Z",
    equipmentId?: string,
    returned = false,
  ) {
    const equipment_id = equipmentId ?? (await item()).id;
    const now = new Date(start);
    const req = await db.loanRequest.create({
      data: {
        tenant_id: tenant.id,
        equipment_id,
        requester_membership_id: member.id,
        status: "APPROVED",
        requested_at: now,
        decided_at: now,
        decided_by_membership_id: operator.id,
      },
    });
    return db.loan.create({
      data: {
        tenant_id: tenant.id,
        equipment_id,
        loan_request_id: req.id,
        borrower_membership_id: member.id,
        approved_by_membership_id: operator.id,
        checked_out_at: now,
        due_at: calculateLoanDueAt(now),
        ...(returned
          ? {
              returned_at: new Date("2100-02-01T13:00:00Z"),
              returned_by_membership_id: operator.id,
            }
          : {}),
      },
    });
  }
  const request = await pending();
  return {
    tenant,
    own,
    other,
    operator,
    secondOperator,
    category,
    request,
    item,
    pending,
    existing,
  };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
async function unchanged(f: Fixture) {
  expect(
    await db.loanRequest.findUnique({ where: { id: f.request.id } }),
  ).toMatchObject({
    status: "PENDING",
    decided_at: null,
    decided_by_membership_id: null,
  });
  expect(
    await db.loan.count({ where: { loan_request_id: f.request.id } }),
  ).toBe(0);
  expect(
    await db.auditLog.count({
      where: { tenant_id: f.tenant.id, action: "loan_request.approved" },
    }),
  ).toBe(0);
}

describe("CA-E03/E04/E05/E06/E07 — aprovação transacional", () => {
  it.each(["OPERATIONS", "ADMIN"] as const)(
    "%s aprova, cria um empréstimo útil e audita o ator da sessão",
    async (role) => {
      const f = await fixture(role);
      const clock = vi.fn(() => new Date("2026-11-09T13:12:34.567Z"));
      const result = await approveRequest(
        reader(f.operator),
        f.request.id,
        clock,
      );
      expect(clock).toHaveBeenCalledTimes(1);
      expect(result.request).toEqual({
        id: f.request.id,
        status: "APPROVED",
        decided_at: new Date("2026-11-09T13:12:34.567Z"),
      });
      expect(result.loan.due_at.toISOString()).toBe("2026-11-27T13:12:34.567Z");
      expect(result.loan.due_rule).toBe("BUSINESS_14_SP");
      const saved = await db.loan.findUniqueOrThrow({
        where: { id: result.loan.id },
      });
      expect(saved).toMatchObject({
        tenant_id: f.tenant.id,
        borrower_membership_id: f.own.id,
        approved_by_membership_id: f.operator.id,
      });
      expect(saved.checked_out_at).toEqual(result.request.decided_at);
      expect(
        await db.auditLog.findFirst({
          where: { resource_id: f.request.id, action: "loan_request.approved" },
        }),
      ).toMatchObject({
        actor_membership_id: f.operator.id,
        tenant_id: f.tenant.id,
        resource_type: "loan_request",
        metadata: { equipment_id: f.request.equipment_id, loan_id: saved.id },
      });
      expect((await api(f.own).loans.mine({})).items[0].id).toBe(saved.id);
      expect((await api(f.operator).requests.pending({})).items).toEqual([]);
    },
  );

  it("pendentes são restritos ao tenant, paginados e expõem somente dados para decisão", async () => {
    const f = await fixture(),
      g = await fixture();
    const next = await f.pending(f.other);
    const one = await api(f.operator).requests.pending({ limit: 1 });
    const two = await api(f.secondOperator).requests.pending({
      limit: 1,
      cursor: one.nextCursor!,
    });
    expect(
      new Set([...one.items, ...two.items].map((item) => item.id)),
    ).toEqual(new Set([f.request.id, next.id]));
    expect(two.nextCursor).toBeNull();
    expect(one.items[0].requester.profile.full_name).toBe(
      "Pessoa sintética E05",
    );
    expect(JSON.stringify(one)).not.toContain('"user_id"');
    expect(
      (await api(g.operator).requests.pending({})).items.map((item) => item.id),
    ).toEqual([g.request.id]);
    await expect(
      api(f.operator).requests.pending({ cursor: g.request.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api(f.operator).requests.approve({ requestId: g.request.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await unchanged(g);
  });

  it("colaborador, ausência de sessão/vínculo e papel forjado não acessam decisões", async () => {
    const f = await fixture();
    for (const client of [
      api(f.own),
      api({ ...f.own, role: "ADMIN" }),
      api(f.operator, f.other.user_id),
      api(null, f.own.user_id),
    ]) {
      await expect(client.requests.pending({})).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        client.requests.approve({ requestId: f.request.id }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(
      api(null).requests.approve({ requestId: f.request.id }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await unchanged(f);
  });

  it.each([
    "actor-membership",
    "actor-profile",
    "borrower-membership",
    "borrower-profile",
    "tenant",
    "equipment",
    "category",
  ])("revalida %s desativado depois do pedido", async (kind) => {
    const f = await fixture();
    if (kind.endsWith("membership"))
      await db.membership.update({
        where: { id: kind.startsWith("actor") ? f.operator.id : f.own.id },
        data: { deactivated_at: new Date() },
      });
    else if (kind.endsWith("profile"))
      await db.profile.update({
        where: {
          id: kind.startsWith("actor") ? f.operator.user_id : f.own.user_id,
        },
        data: { deactivated_at: new Date() },
      });
    else if (kind === "tenant")
      await db.tenant.update({
        where: { id: f.tenant.id },
        data: { deactivated_at: new Date() },
      });
    else if (kind === "equipment")
      await db.equipment.update({
        where: { id: f.request.equipment_id },
        data: { deactivated_at: new Date() },
      });
    else
      await db.equipmentCategory.update({
        where: { id: f.category.id },
        data: { deactivated_at: new Date() },
      });
    await expect(
      api(f.operator).requests.approve({ requestId: f.request.id }),
    ).rejects.toMatchObject({
      code: ["equipment", "category"].includes(kind) ? "CONFLICT" : "FORBIDDEN",
    });
    await unchanged(f);
  });

  it("papel atual no banco prevalece sobre contexto antigo", async () => {
    const f = await fixture();
    await db.membership.update({
      where: { id: f.operator.id },
      data: { role: "COLLABORATOR" },
    });
    await expect(
      api(f.operator).requests.approve({ requestId: f.request.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(api(f.operator).requests.pending({})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await unchanged(f);
  });

  it.each([3, 4])(
    "%s ativos adquiridos depois do pedido impedem aprovação",
    async (count) => {
      const f = await fixture();
      for (let i = 0; i < count; i++) await f.existing();
      await expect(
        api(f.operator).requests.approve({ requestId: f.request.id }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message:
          "Você já está com 3 equipamentos. Aguarde uma devolução para solicitar outro.",
      });
      await unchanged(f);
    },
  );

  it("dois ativos sem atraso permitem terceiro; outras pessoas/devolvidos não contam", async () => {
    const f = await fixture();
    await f.existing();
    await f.existing();
    await f.existing(f.own, "2020-01-06T13:00:00Z", undefined, true);
    await f.existing(f.other, "2020-01-06T13:00:00Z");
    expect(
      (await api(f.operator).requests.approve({ requestId: f.request.id }))
        .request.status,
    ).toBe("APPROVED");
    expect((await api(f.own).loans.summary()).activeCount).toBe(3);
  });

  it("atraso adquirido depois do pedido bloqueia; vencimento igual ao relógio permite", async () => {
    const f = await fixture();
    const old = await f.existing(f.own, "2026-10-05T13:00:00Z");
    // Pedido anterior ao vencimento para testar a fronteira sem relógio regressivo.
    await db.loanRequest.update({
      where: { id: f.request.id },
      data: { requested_at: new Date("2026-10-01T13:00:00Z") },
    });
    await expect(
      approveRequest(
        reader(f.operator),
        f.request.id,
        () => new Date(old.due_at.getTime() + 1),
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "Você tem equipamento em atraso. Regularize a devolução antes de solicitar outro.",
    });
    await unchanged(f);
    expect(
      (await approveRequest(reader(f.operator), f.request.id, () => old.due_at))
        .request.status,
    ).toBe("APPROVED");
  });

  it("devolução apenas solicitada continua contando", async () => {
    const f = await fixture();
    const loan = await f.existing();
    await f.existing();
    await f.existing();
    await db.loan.update({
      where: { id: loan.id },
      data: { return_requested_at: new Date("2100-01-05T13:00:00Z") },
    });
    await expect(
      api(f.operator).requests.approve({ requestId: f.request.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await unchanged(f);
  });

  it.each(["MAINTENANCE", "OUT_OF_SERVICE"] as const)(
    "equipamento mudou para %s",
    async (status) => {
      const f = await fixture();
      await db.equipment.update({
        where: { id: f.request.equipment_id },
        data: { operational_status: status },
      });
      await expect(
        api(f.operator).requests.approve({ requestId: f.request.id }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await unchanged(f);
    },
  );

  it("empréstimo ativo surgido no equipamento impede aprovação", async () => {
    const f = await fixture();
    await f.existing(f.other, "2100-01-04T13:00:00Z", f.request.equipment_id);
    await expect(
      api(f.operator).requests.approve({ requestId: f.request.id }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await unchanged(f);
  });

  it("repetir decisão não duplica empréstimo/auditoria; rejeitado também não aprova", async () => {
    const f = await fixture();
    await api(f.operator).requests.approve({ requestId: f.request.id });
    await expect(
      api(f.secondOperator).requests.approve({ requestId: f.request.id }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Esta solicitação já foi decidida. Atualize a lista.",
    });
    expect(
      await db.loan.count({ where: { loan_request_id: f.request.id } }),
    ).toBe(1);
    expect(
      await db.auditLog.count({
        where: { resource_id: f.request.id, action: "loan_request.approved" },
      }),
    ).toBe(1);
    const g = await fixture();
    await db.loanRequest.update({
      where: { id: g.request.id },
      data: {
        status: "REJECTED",
        decided_at: new Date(),
        decided_by_membership_id: g.operator.id,
        rejection_reason: "Fixture",
      },
    });
    await expect(
      api(g.operator).requests.approve({ requestId: g.request.id }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(
      await db.loan.count({ where: { loan_request_id: g.request.id } }),
    ).toBe(0);
  });

  it("concorrência entre dois aprovadores no mesmo pedido: um empréstimo/auditoria", async () => {
    const f = await fixture();
    const results = await Promise.allSettled([
      api(f.operator).requests.approve({ requestId: f.request.id }),
      api(f.secondOperator).requests.approve({ requestId: f.request.id }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === "rejected"),
    ).toMatchObject({ reason: { code: "CONFLICT" } });
    expect(
      await db.loan.count({ where: { loan_request_id: f.request.id } }),
    ).toBe(1);
    expect(
      await db.auditLog.count({
        where: { resource_id: f.request.id, action: "loan_request.approved" },
      }),
    ).toBe(1);
  });

  it("duas aprovações de equipamentos diferentes com dois ativos chegam a três, nunca quatro", async () => {
    const f = await fixture();
    const next = await f.pending();
    await f.existing();
    await f.existing();
    const results = await Promise.allSettled([
      api(f.operator).requests.approve({ requestId: f.request.id }),
      api(f.secondOperator).requests.approve({ requestId: next.id }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === "rejected"),
    ).toMatchObject({ reason: { code: "FORBIDDEN" } });
    expect((await api(f.own).loans.summary()).activeCount).toBe(3);
    expect(
      await db.loanRequest.count({
        where: { tenant_id: f.tenant.id, status: "PENDING" },
      }),
    ).toBe(1);
    expect(
      await db.auditLog.count({
        where: { tenant_id: f.tenant.id, action: "loan_request.approved" },
      }),
    ).toBe(1);
  });

  it.each(["loans", "audit_logs"])(
    "falha real em %s desfaz decisão/empréstimo/auditoria",
    async (table) => {
      const f = await fixture();
      await db.$executeRawUnsafe(
        "CREATE FUNCTION fixture_e05_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falha sintética E05'; END; $$",
      );
      await db.$executeRawUnsafe(
        `CREATE TRIGGER fixture_e05_fail BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION fixture_e05_fail()`,
      );
      try {
        await expect(
          api(f.operator).requests.approve({ requestId: f.request.id }),
        ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
        await unchanged(f);
      } finally {
        await db.$executeRawUnsafe(`DROP TRIGGER fixture_e05_fail ON ${table}`);
        await db.$executeRawUnsafe("DROP FUNCTION fixture_e05_fail()");
      }
      expect(
        (await api(f.operator).requests.approve({ requestId: f.request.id }))
          .request.status,
      ).toBe("APPROVED");
    },
  );

  it("relógio anterior à solicitação não aprova nem altera o pedido", async () => {
    const f = await fixture();
    await db.loanRequest.update({
      where: { id: f.request.id },
      data: { requested_at: new Date("2100-01-01T13:00:00Z") },
    });
    await expect(
      api(f.operator).requests.approve({ requestId: f.request.id }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await unchanged(f);
  });

  it("fronteira de microssegundos não aprova antes da solicitação", async () => {
    const f = await fixture();
    await db.$executeRaw`UPDATE loan_requests SET requested_at = '2026-11-09T13:00:00.123456Z'::timestamptz WHERE id = ${f.request.id}::uuid`;
    await expect(
      approveRequest(
        reader(f.operator),
        f.request.id,
        () => new Date("2026-11-09T13:00:00.123Z"),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await unchanged(f);
    expect(
      (
        await approveRequest(
          reader(f.operator),
          f.request.id,
          () => new Date("2026-11-09T13:00:00.124Z"),
        )
      ).request.status,
    ).toBe("APPROVED");
  });

  it("lock ocupado não deixa decisão parcial e permite tentar novamente após liberar", async () => {
    const f = await fixture();
    let locked!: () => void, release!: () => void;
    const ready = new Promise<void>((resolve) => {
      locked = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const blocker = db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${f.request.equipment_id}::uuid FOR UPDATE`;
        locked();
        await released;
      },
      { timeout: 15000 },
    );
    await ready;
    try {
      await expect(
        api(f.operator).requests.approve({ requestId: f.request.id }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await unchanged(f);
    } finally {
      release();
      await blocker;
    }
    expect(
      (await api(f.operator).requests.approve({ requestId: f.request.id }))
        .request.status,
    ).toBe("APPROVED");
  });

  it("inputs estritos e UUID inexistente não mudam nada", async () => {
    const f = await fixture();
    for (const input of [
      {},
      { requestId: "inválido" },
      { requestId: f.request.id, tenantId: f.tenant.id },
      { requestId: f.request.id, decided_at: new Date() },
      { requestId: f.request.id, approved_by_membership_id: f.other.id },
    ])
      await expect(
        api(f.operator).requests.approve(input as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api(f.operator).requests.approve({ requestId: randomUUID() }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      api(f.operator).requests.pending({ limit: 49 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await unchanged(f);
  });

  it("HTTP tRPC: COLLABORATOR recebe 403, aprovação 200 e repetição 409", async () => {
    const f = await fixture();
    const send = (member: Membership) =>
      fetchRequestHandler({
        endpoint: "/api/trpc",
        router: appRouter,
        req: new Request("http://localhost/api/trpc/requests.approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            superjson.serialize({ requestId: f.request.id }),
          ),
        }),
        createContext: () => context(member),
      });
    const denied = await send(f.own);
    expect(denied.status).toBe(403);
    expect((await denied.json()).error.json.data.code).toBe("FORBIDDEN");
    const allowed = await send(f.operator);
    expect(allowed.status).toBe(200);
    expect((await allowed.json()).result.data.json.loan.due_rule).toBe(
      "BUSINESS_14_SP",
    );
    const duplicate = await send(f.secondOperator);
    expect(duplicate.status).toBe(409);
    expect((await duplicate.json()).error.json.data.code).toBe("CONFLICT");
  });
});
