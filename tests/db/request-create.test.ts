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
function api(
  member: Membership | null,
  userId: string | null = member?.user_id ?? null,
) {
  return appRouter.createCaller({
    db,
    user: userId ? { id: userId } : null,
    membership: member,
    headers: new Headers(),
    auth: {},
  } as Context);
}
async function person(
  tenantId: string,
  role: Membership["role"] = "COLLABORATOR",
) {
  const id = randomUUID();
  await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${id}::uuid)`;
  await db.profile.create({ data: { id, full_name: "Fixture E04" } });
  return db.membership.create({
    data: { tenant_id: tenantId, user_id: id, role },
  });
}
async function fixture() {
  const tenant = await db.tenant.create({
    data: { slug: randomUUID(), name: "Fixture E04" },
  });
  const own = await person(tenant.id),
    other = await person(tenant.id),
    operator = await person(tenant.id, "OPERATIONS");
  const category = await db.equipmentCategory.create({
    data: { tenant_id: tenant.id, name: "Fixture" },
  });
  async function item() {
    return db.equipment.create({
      data: {
        tenant_id: tenant.id,
        category_id: category.id,
        asset_tag: randomUUID(),
        name: "Fixture",
        pickup_location: "Operações",
      },
    });
  }
  async function loan(
    member = own,
    start = "2100-01-04T13:00:00Z",
    returned = false,
  ) {
    const equipment = await item();
    const checkedOut = new Date(start);
    const request = await db.loanRequest.create({
      data: {
        tenant_id: tenant.id,
        equipment_id: equipment.id,
        requester_membership_id: member.id,
        status: "APPROVED",
        requested_at: checkedOut,
        decided_at: checkedOut,
        decided_by_membership_id: operator.id,
      },
    });
    return db.loan.create({
      data: {
        tenant_id: tenant.id,
        equipment_id: equipment.id,
        loan_request_id: request.id,
        borrower_membership_id: member.id,
        approved_by_membership_id: operator.id,
        checked_out_at: checkedOut,
        due_at: calculateLoanDueAt(checkedOut),
        ...(returned
          ? {
              return_requested_at: new Date("2100-02-01T13:00:00Z"),
              returned_at: new Date("2100-02-02T13:00:00Z"),
              returned_by_membership_id: operator.id,
            }
          : {}),
      },
    });
  }
  const equipment = await item();
  return { tenant, own, other, operator, category, equipment, item, loan };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
function reader(f: Fixture) {
  return {
    db,
    tenantId: f.tenant.id,
    membershipId: f.own.id,
    userId: f.own.user_id,
  };
}
async function empty(f: Fixture) {
  expect(
    await db.loanRequest.count({
      where: { tenant_id: f.tenant.id, status: "PENDING" },
    }),
  ).toBe(0);
  expect(await db.auditLog.count({ where: { tenant_id: f.tenant.id } })).toBe(
    0,
  );
}

describe("CA-E02/E03 — criação de pedido pendente", () => {
  it("cria somente PENDING e auditoria atômica com ator/tenant do contexto, sem vencimento", async () => {
    const f = await fixture();
    const now = new Date("2026-11-09T13:00:00Z");
    const result = await createRequest(reader(f), f.equipment.id, () => now);
    expect(result).toEqual({
      id: expect.any(String),
      equipment_id: f.equipment.id,
      status: "PENDING",
      requested_at: now,
    });
    expect(await db.loan.count({ where: { tenant_id: f.tenant.id } })).toBe(0);
    const request = await db.loanRequest.findUniqueOrThrow({
      where: { id: result.id },
    });
    expect(request.requester_membership_id).toBe(f.own.id);
    expect(request.decided_at).toBeNull();
    const audit = await db.auditLog.findFirstOrThrow({
      where: { tenant_id: f.tenant.id },
    });
    expect(audit).toMatchObject({
      actor_membership_id: f.own.id,
      action: "loan_request.created",
      resource_type: "loan_request",
      resource_id: result.id,
      metadata: { equipment_id: f.equipment.id },
    });
    expect(
      (await api(f.own).catalogue.list({ onlyAvailable: true })).items,
    ).toEqual([]);
    expect((await api(f.own).catalogue.list({})).items[0].availability).toBe(
      "PENDING",
    );
    expect((await api(f.own).requests.mine({})).items[0].id).toBe(result.id);
    expect(await api(f.own).loans.summary()).toEqual({
      activeCount: 0,
      maxActive: 3,
      hasOverdue: false,
    });
  });

  it.each([0, 1, 2])(
    "%s empréstimos ativos sem atraso permitem solicitar",
    async (count) => {
      const f = await fixture();
      for (let i = 0; i < count; i++) await f.loan();
      const result = await api(f.own).requests.create({
        equipmentId: f.equipment.id,
      });
      expect(result.status).toBe("PENDING");
      expect(await db.loan.count({ where: { tenant_id: f.tenant.id } })).toBe(
        count,
      );
    },
  );

  it.each([3, 4])(
    "%s ativos bloqueiam novo pedido sem efeitos",
    async (count) => {
      const f = await fixture();
      for (let i = 0; i < count; i++) await f.loan();
      await expect(
        api(f.own).requests.create({ equipmentId: f.equipment.id }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        message:
          "Você já está com 3 equipamentos. Aguarde uma devolução para solicitar outro.",
      });
      await empty(f);
    },
  );

  it("atraso bloqueia mesmo abaixo do teto; igualdade do vencimento não é atraso", async () => {
    const f = await fixture();
    const loan = await f.loan(f.own, "2020-01-06T13:00:00Z");
    await expect(
      createRequest(
        reader(f),
        f.equipment.id,
        () => new Date(loan.due_at.getTime() + 1),
      ),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
      message:
        "Você tem equipamento em atraso. Regularize a devolução antes de solicitar outro.",
    });
    await empty(f);
    expect(
      (await createRequest(reader(f), f.equipment.id, () => loan.due_at))
        .status,
    ).toBe("PENDING");
  });

  it("devolução solicitada ainda conta no teto; devolvido e empréstimos de outra pessoa não contam", async () => {
    const f = await fixture();
    const active = await f.loan();
    await f.loan();
    await f.loan();
    await db.loan.update({
      where: { id: active.id },
      data: { return_requested_at: new Date("2100-01-05T13:00:00Z") },
    });
    await expect(
      api(f.own).requests.create({ equipmentId: f.equipment.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const g = await fixture();
    await g.loan(g.own, "2020-01-06T13:00:00Z", true);
    await g.loan(g.other, "2020-01-06T13:00:00Z");
    expect(
      (await api(g.own).requests.create({ equipmentId: g.equipment.id }))
        .status,
    ).toBe("PENDING");
  });

  it("pedidos pendentes não contam como empréstimos nem iniciam prazo", async () => {
    const f = await fixture();
    for (let i = 0; i < 4; i++)
      await api(f.own).requests.create({ equipmentId: (await f.item()).id });
    expect(
      (await api(f.own).requests.create({ equipmentId: f.equipment.id }))
        .status,
    ).toBe("PENDING");
    expect(await db.loan.count({ where: { tenant_id: f.tenant.id } })).toBe(0);
  });

  it.each(["MAINTENANCE", "OUT_OF_SERVICE"] as const)(
    "%s não aceita pedido",
    async (status) => {
      const f = await fixture();
      await db.equipment.update({
        where: { id: f.equipment.id },
        data: { operational_status: status },
      });
      await expect(
        api(f.own).requests.create({ equipmentId: f.equipment.id }),
      ).rejects.toMatchObject({
        code: "CONFLICT",
        message: "A disponibilidade mudou. Atualize a lista e tente novamente.",
      });
      await empty(f);
    },
  );

  it("empréstimo ativo ou pedido de outra pessoa bloqueiam sem expor identidade", async () => {
    const f = await fixture();
    const occupied = await f.loan(f.other);
    await expect(
      api(f.own).requests.create({ equipmentId: occupied.equipment_id }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await api(f.other).requests.create({ equipmentId: f.equipment.id });
    await expect(
      api(f.own).requests.create({ equipmentId: f.equipment.id }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "A disponibilidade mudou. Atualize a lista e tente novamente.",
    });
    expect(await db.auditLog.count({ where: { tenant_id: f.tenant.id } })).toBe(
      1,
    );
  });

  it("repetir o mesmo pedido não duplica nem audita novamente", async () => {
    const f = await fixture();
    await api(f.own).requests.create({ equipmentId: f.equipment.id });
    await expect(
      api(f.own).requests.create({ equipmentId: f.equipment.id }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(
      await db.loanRequest.count({ where: { tenant_id: f.tenant.id } }),
    ).toBe(1);
    expect(await db.auditLog.count({ where: { tenant_id: f.tenant.id } })).toBe(
      1,
    );
  });

  it("pedido rejeitado libera novo pedido, sem alterar o histórico", async () => {
    const f = await fixture();
    const old = await db.loanRequest.create({
      data: {
        tenant_id: f.tenant.id,
        equipment_id: f.equipment.id,
        requester_membership_id: f.other.id,
        status: "REJECTED",
        requested_at: new Date("2020-01-01T13:00:00Z"),
        decided_at: new Date("2020-01-02T13:00:00Z"),
        decided_by_membership_id: f.operator.id,
        rejection_reason: "Fixture",
      },
    });
    expect(
      (await api(f.own).requests.create({ equipmentId: f.equipment.id }))
        .status,
    ).toBe("PENDING");
    expect(await db.loanRequest.findUnique({ where: { id: old.id } })).toEqual(
      old,
    );
  });

  it.each(["equipment", "category"] as const)(
    "%s desativado e UUID inexistente recebem NOT_FOUND",
    async (kind) => {
      const f = await fixture();
      if (kind === "equipment")
        await db.equipment.update({
          where: { id: f.equipment.id },
          data: { deactivated_at: new Date() },
        });
      else
        await db.equipmentCategory.update({
          where: { id: f.category.id },
          data: { deactivated_at: new Date() },
        });
      for (const equipmentId of [f.equipment.id, randomUUID()])
        await expect(
          api(f.own).requests.create({ equipmentId }),
        ).rejects.toMatchObject({ code: "NOT_FOUND" });
      await empty(f);
    },
  );

  it("tenant A não cria pedido/auditoria no equipamento de B", async () => {
    const a = await fixture(),
      b = await fixture();
    await expect(
      api(a.own).requests.create({ equipmentId: b.equipment.id }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Solicitação ou equipamento não encontrado.",
    });
    await empty(a);
    await empty(b);
    expect(
      (await api(b.own).requests.create({ equipmentId: b.equipment.id }))
        .status,
    ).toBe("PENDING");
  });

  it("nega sessão/vínculo ausentes e contexto que troca usuário/tenant", async () => {
    const f = await fixture();
    const input = { equipmentId: f.equipment.id };
    await expect(api(null).requests.create(input)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(
      api(null, f.own.user_id).requests.create(input),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api(f.own, f.other.user_id).requests.create(input),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api({ ...f.own, tenant_id: randomUUID() }).requests.create(input),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await empty(f);
  });

  it.each(["membership", "profile", "tenant"] as const)(
    "revalida %s desativado depois de resolver a sessão",
    async (kind) => {
      const f = await fixture();
      if (kind === "membership")
        await db.membership.update({
          where: { id: f.own.id },
          data: { deactivated_at: new Date() },
        });
      else if (kind === "profile")
        await db.profile.update({
          where: { id: f.own.user_id },
          data: { deactivated_at: new Date() },
        });
      else
        await db.tenant.update({
          where: { id: f.tenant.id },
          data: { deactivated_at: new Date() },
        });
      await expect(
        api(f.own).requests.create({ equipmentId: f.equipment.id }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await empty(f);
    },
  );

  it("input rejeita UUID inválido, dados extras e autoria fornecida pelo cliente", async () => {
    const f = await fixture();
    for (const input of [
      {},
      { equipmentId: "inválido" },
      { equipmentId: f.equipment.id, tenantId: f.tenant.id },
      { equipmentId: f.equipment.id, requester_membership_id: f.other.id },
      { equipmentId: f.equipment.id, status: "APPROVED" },
    ]) {
      await expect(
        api(f.own).requests.create(input as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    await empty(f);
  });

  it.each([false, true])(
    "concorrência pelo mesmo equipamento, mesma pessoa=%s: somente um pedido/auditoria",
    async (samePerson) => {
      const f = await fixture();
      const results = await Promise.allSettled([
        api(f.own).requests.create({ equipmentId: f.equipment.id }),
        api(samePerson ? f.own : f.other).requests.create({
          equipmentId: f.equipment.id,
        }),
      ]);
      expect(
        results.filter((result) => result.status === "fulfilled"),
      ).toHaveLength(1);
      const failed = results.find((result) => result.status === "rejected");
      expect(failed).toMatchObject({ reason: { code: "CONFLICT" } });
      expect(
        await db.loanRequest.count({ where: { tenant_id: f.tenant.id } }),
      ).toBe(1);
      expect(
        await db.auditLog.count({ where: { tenant_id: f.tenant.id } }),
      ).toBe(1);
      expect(await db.loan.count({ where: { tenant_id: f.tenant.id } })).toBe(
        0,
      );
    },
  );

  it("falha real na auditoria desfaz o pedido inteiro", async () => {
    const f = await fixture();
    await db.$executeRawUnsafe(
      "CREATE FUNCTION fixture_e04_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falha sintética E04'; END; $$",
    );
    await db.$executeRawUnsafe(
      "CREATE TRIGGER fixture_e04_fail_audit BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fixture_e04_fail_audit()",
    );
    try {
      await expect(
        api(f.own).requests.create({ equipmentId: f.equipment.id }),
      ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
      await empty(f);
    } finally {
      await db.$executeRawUnsafe(
        "DROP TRIGGER fixture_e04_fail_audit ON audit_logs",
      );
      await db.$executeRawUnsafe("DROP FUNCTION fixture_e04_fail_audit()");
    }
    expect(
      (await api(f.own).requests.create({ equipmentId: f.equipment.id }))
        .status,
    ).toBe("PENDING");
  });

  it("HTTP tRPC retorna 200/PENDING e 409 na repetição, com erro sanitizado", async () => {
    const f = await fixture();
    const send = () =>
      fetchRequestHandler({
        endpoint: "/api/trpc",
        router: appRouter,
        req: new Request("http://localhost/api/trpc/requests.create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            superjson.serialize({ equipmentId: f.equipment.id }),
          ),
        }),
        createContext: () =>
          ({
            db,
            user: { id: f.own.user_id },
            membership: f.own,
            headers: new Headers(),
            auth: {},
          }) as Context,
      });
    const created = await send();
    expect(created.status).toBe(200);
    const body = await created.json();
    expect(body.result.data.json.status).toBe("PENDING");
    expect(body.result.data.json.equipment_id).toBe(f.equipment.id);
    expect(body.result.data.json.due_at).toBeUndefined();
    const repeated = await send();
    expect(repeated.status).toBe(409);
    const error = await repeated.json();
    expect(error.error.json.data.code).toBe("CONFLICT");
    expect(error.error.json.message).toBe(
      "A disponibilidade mudou. Atualize a lista e tente novamente.",
    );
    expect(
      superjson.deserialize<{ data: { stack?: string } }>(error.error).data
        .stack,
    ).toBeUndefined();
  });

  it("lock ocupado retorna CONFLICT após timeout sem pedido/auditoria e libera nova tentativa", async () => {
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
        await tx.$queryRaw`SELECT id FROM equipment WHERE id = ${f.equipment.id}::uuid FOR UPDATE`;
        locked();
        await released;
      },
      { timeout: 15000 },
    );
    await ready;
    try {
      await expect(
        api(f.own).requests.create({ equipmentId: f.equipment.id }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await empty(f);
    } finally {
      release();
      await blocker;
    }
    expect(
      (await api(f.own).requests.create({ equipmentId: f.equipment.id }))
        .status,
    ).toBe("PENDING");
  });
});
