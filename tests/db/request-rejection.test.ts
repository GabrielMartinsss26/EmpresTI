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
import { rejectRequest } from "../../src/server/services/request-rejection";
import { createRequest } from "../../src/server/services/requests";
import { calculateLoanDueAt } from "../../src/server/services/loan-due-date";

let local: Awaited<ReturnType<typeof startTestDatabase>>, db: PrismaClient;
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
    userId: member.user_id,
    membershipId: member.id,
    tenantId: member.tenant_id,
  };
}
async function person(tenantId: string, role: Membership["role"]) {
  const id = randomUUID();
  await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${id}::uuid)`;
  await db.profile.create({ data: { id, full_name: "Pessoa sintética E06" } });
  return db.membership.create({
    data: { tenant_id: tenantId, user_id: id, role },
  });
}
async function fixture(role: Membership["role"] = "OPERATIONS") {
  const tenant = await db.tenant.create({
    data: { slug: randomUUID(), name: "Fixture E06" },
  });
  const own = await person(tenant.id, "COLLABORATOR"),
    other = await person(tenant.id, "COLLABORATOR"),
    operator = await person(tenant.id, role),
    secondOperator = await person(tenant.id, "ADMIN");
  const category = await db.equipmentCategory.create({
    data: { tenant_id: tenant.id, name: "Fixture" },
  });
  async function item() {
    return db.equipment.create({
      data: {
        tenant_id: tenant.id,
        category_id: category.id,
        name: "Fixture",
        asset_tag: randomUUID(),
        pickup_location: "Operações",
      },
    });
  }
  const equipment = await item();
  const request = await createRequest(
    reader(own),
    equipment.id,
    () => new Date("2026-11-01T13:00:00Z"),
  );
  async function existing(equipmentId?: string, member = own) {
    const equipment_id = equipmentId ?? (await item()).id,
      now = new Date("2020-01-06T13:00:00Z");
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
      },
    });
  }
  return {
    tenant,
    own,
    other,
    operator,
    secondOperator,
    category,
    equipment,
    request,
    existing,
  };
}
type Fixture = Awaited<ReturnType<typeof fixture>>;
function input(f: Fixture, reason = "Motivo sintético") {
  return { requestId: f.request.id, reason };
}
async function unchanged(f: Fixture) {
  expect(
    await db.loanRequest.findUnique({ where: { id: f.request.id } }),
  ).toMatchObject({
    status: "PENDING",
    decided_at: null,
    decided_by_membership_id: null,
    rejection_reason: null,
  });
  expect(
    await db.loan.count({ where: { loan_request_id: f.request.id } }),
  ).toBe(0);
  expect(
    await db.auditLog.count({
      where: { resource_id: f.request.id, action: "loan_request.rejected" },
    }),
  ).toBe(0);
}
async function send(member: Membership | null, value: unknown) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req: new Request("http://localhost/api/trpc/requests.reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(superjson.serialize(value)),
    }),
    createContext: () => context(member),
  });
}

describe("CA-E04/E08 — rejeição com motivo", () => {
  it.each(["OPERATIONS", "ADMIN"] as const)(
    "%s rejeita com motivo normalizado, ator/data e auditoria sem Loan",
    async (role) => {
      const f = await fixture(role);
      const now = new Date("2026-11-09T13:00:00.123Z"),
        clock = vi.fn(() => now);
      expect(
        await rejectRequest(
          reader(f.operator),
          f.request.id,
          "  Motivo sintético\n ",
          clock,
        ),
      ).toEqual({
        id: f.request.id,
        status: "REJECTED",
        decided_at: now,
        rejection_reason: "Motivo sintético",
      });
      expect(clock).toHaveBeenCalledTimes(1);
      expect(
        await db.loanRequest.findUnique({ where: { id: f.request.id } }),
      ).toMatchObject({
        decided_by_membership_id: f.operator.id,
        rejection_reason: "Motivo sintético",
      });
      expect(await db.loan.count({ where: { tenant_id: f.tenant.id } })).toBe(
        0,
      );
      expect(
        await db.auditLog.findFirst({
          where: { resource_id: f.request.id, action: "loan_request.rejected" },
        }),
      ).toMatchObject({
        tenant_id: f.tenant.id,
        actor_membership_id: f.operator.id,
        resource_type: "loan_request",
        metadata: { equipment_id: f.equipment.id },
      });
      expect(
        (await api(f.own).requests.mine({})).items[0].rejection_reason,
      ).toBe("Motivo sintético");
      expect((await api(f.operator).requests.pending({})).items).toEqual([]);
    },
  );

  it("libera novo pedido no item disponível sem alterar o pedido rejeitado", async () => {
    const f = await fixture();
    await api(f.operator).requests.reject(input(f));
    const old = await db.loanRequest.findUnique({
      where: { id: f.request.id },
    });
    expect(
      (await api(f.own).catalogue.list({ onlyAvailable: true })).items.map(
        (item) => item.id,
      ),
    ).toEqual([f.equipment.id]);
    const next = await api(f.other).requests.create({
      equipmentId: f.equipment.id,
    });
    expect(next.id).not.toBe(f.request.id);
    expect(next.status).toBe("PENDING");
    expect(
      await db.loanRequest.findUnique({ where: { id: f.request.id } }),
    ).toEqual(old);
    expect(
      await db.loanRequest.count({
        where: { equipment_id: f.equipment.id, status: "PENDING" },
      }),
    ).toBe(1);
  });

  it.each([1, 500])(
    "aceita motivo de %s caracteres após trim",
    async (length) => {
      const f = await fixture();
      expect(
        (
          await api(f.operator).requests.reject(
            input(f, ` ${"a".repeat(length)} `),
          )
        ).rejection_reason,
      ).toHaveLength(length);
    },
  );

  it.each(["", "   ", "\n\t", "a".repeat(501)])(
    "recusa motivo inválido sem efeitos (%#)",
    async (reason) => {
      const f = await fixture();
      await expect(
        api(f.operator).requests.reject(input(f, reason)),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
      await expect(
        rejectRequest(reader(f.operator), f.request.id, reason),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "Informe o motivo da rejeição.",
      });
      await unchanged(f);
    },
  );

  it("valida motivo ausente/tipo inválido, UUID e autoria extra no input", async () => {
    const f = await fixture();
    for (const value of [
      { requestId: f.request.id },
      { requestId: f.request.id, reason: 10 },
      { ...input(f), requestId: "inválido" },
      { ...input(f), tenantId: f.tenant.id },
      { ...input(f), decided_by_membership_id: f.other.id },
    ])
      await expect(
        api(f.operator).requests.reject(value as never),
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await unchanged(f);
  });

  it("colaborador, sessão/vínculo ausente e papel forjado não rejeitam", async () => {
    const f = await fixture();
    for (const client of [
      api(f.own),
      api({ ...f.own, role: "ADMIN" }),
      api(f.operator, f.other.user_id),
      api(null, f.own.user_id),
    ])
      await expect(client.requests.reject(input(f))).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    await expect(api(null).requests.reject(input(f))).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await unchanged(f);
  });

  it("papel revogado e contexto com tenant trocado não autorizam", async () => {
    const f = await fixture();
    await expect(
      api({ ...f.operator, tenant_id: randomUUID() }).requests.reject(input(f)),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await db.membership.update({
      where: { id: f.operator.id },
      data: { role: "COLLABORATOR" },
    });
    await expect(
      api(f.operator).requests.reject(input(f)),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await unchanged(f);
  });

  it("tenant A não rejeita pedido de B e ID inexistente dá a mesma resposta", async () => {
    const f = await fixture(),
      g = await fixture();
    for (const requestId of [g.request.id, randomUUID()])
      await expect(
        api(f.operator).requests.reject({ requestId, reason: "Fixture" }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Solicitação ou equipamento não encontrado.",
      });
    await unchanged(f);
    await unchanged(g);
  });

  it.each([
    "actor-membership",
    "actor-profile",
    "borrower-membership",
    "borrower-profile",
    "tenant",
    "equipment",
    "category",
  ])("revalida %s desativado sob a política de ativos", async (kind) => {
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
        where: { id: f.equipment.id },
        data: { deactivated_at: new Date() },
      });
    else
      await db.equipmentCategory.update({
        where: { id: f.category.id },
        data: { deactivated_at: new Date() },
      });
    await expect(
      api(f.operator).requests.reject(input(f)),
    ).rejects.toMatchObject({
      code: ["equipment", "category"].includes(kind) ? "CONFLICT" : "FORBIDDEN",
    });
    await unchanged(f);
  });

  it.each(["MAINTENANCE", "OUT_OF_SERVICE"] as const)(
    "rejeita em %s sem tornar item disponível",
    async (status) => {
      const f = await fixture();
      await db.equipment.update({
        where: { id: f.equipment.id },
        data: { operational_status: status },
      });
      expect((await api(f.operator).requests.reject(input(f))).status).toBe(
        "REJECTED",
      );
      expect(
        (await api(f.own).catalogue.list({ onlyAvailable: true })).items,
      ).toEqual([]);
      expect(
        (
          await db.equipment.findUniqueOrThrow({
            where: { id: f.equipment.id },
          })
        ).operational_status,
      ).toBe(status);
      await expect(
        api(f.other).requests.create({ equipmentId: f.equipment.id }),
      ).rejects.toMatchObject({ code: "CONFLICT" });
    },
  );

  it("rejeitar não devolve equipamento já emprestado nem altera Loan existente", async () => {
    const f = await fixture();
    const loan = await f.existing(f.equipment.id, f.other);
    await api(f.operator).requests.reject(input(f));
    expect(await db.loan.findUnique({ where: { id: loan.id } })).toEqual(loan);
    expect((await api(f.own).catalogue.list({})).items[0].availability).toBe(
      "LOANED",
    );
    await expect(
      api(f.other).requests.create({ equipmentId: f.equipment.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      api(f.own).requests.create({ equipmentId: f.equipment.id }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("limite/atraso do solicitante não impedem encerrar pedido por rejeição", async () => {
    const f = await fixture();
    await f.existing();
    await f.existing();
    await f.existing();
    expect((await api(f.operator).requests.reject(input(f))).status).toBe(
      "REJECTED",
    );
    expect((await api(f.own).loans.summary()).activeCount).toBe(3);
  });

  it("pedido já rejeitado ou aprovado não aceita nova decisão/motivo", async () => {
    const f = await fixture();
    await api(f.operator).requests.reject(input(f));
    const saved = await db.loanRequest.findUnique({
      where: { id: f.request.id },
    });
    await expect(
      api(f.secondOperator).requests.reject(input(f, "Outro motivo")),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Esta solicitação já foi decidida. Atualize a lista.",
    });
    expect(
      await db.loanRequest.findUnique({ where: { id: f.request.id } }),
    ).toEqual(saved);
    const g = await fixture();
    const approved = await api(g.operator).requests.approve({
      requestId: g.request.id,
    });
    await expect(
      api(g.secondOperator).requests.reject(input(g)),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect(
      await db.loan.findUnique({ where: { id: approved.loan.id } }),
    ).not.toBeNull();
  });

  it("dois operadores rejeitando geram uma decisão/auditoria", async () => {
    const f = await fixture();
    const results = await Promise.allSettled([
      api(f.operator).requests.reject(input(f)),
      api(f.secondOperator).requests.reject(input(f, "Outro motivo")),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === "rejected"),
    ).toMatchObject({ reason: { code: "CONFLICT" } });
    expect(
      await db.auditLog.count({
        where: { resource_id: f.request.id, action: "loan_request.rejected" },
      }),
    ).toBe(1);
    expect(await db.loan.count({ where: { tenant_id: f.tenant.id } })).toBe(0);
  });

  it("aprovar e rejeitar simultaneamente geram uma só decisão e Loan coerente", async () => {
    const f = await fixture();
    const results = await Promise.allSettled([
      api(f.operator).requests.approve({ requestId: f.request.id }),
      api(f.secondOperator).requests.reject(input(f)),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    expect(
      results.find((result) => result.status === "rejected"),
    ).toMatchObject({ reason: { code: "CONFLICT" } });
    const saved = await db.loanRequest.findUniqueOrThrow({
      where: { id: f.request.id },
    });
    expect(
      await db.loan.count({ where: { loan_request_id: f.request.id } }),
    ).toBe(saved.status === "APPROVED" ? 1 : 0);
    expect(
      await db.auditLog.count({
        where: {
          resource_id: f.request.id,
          action: { in: ["loan_request.approved", "loan_request.rejected"] },
        },
      }),
    ).toBe(1);
  });

  it("falha real da auditoria faz rollback e HTTP não expõe detalhes internos", async () => {
    const f = await fixture();
    await db.$executeRawUnsafe(
      "CREATE FUNCTION fixture_e06_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'detalhe interno E06'; END; $$",
    );
    await db.$executeRawUnsafe(
      "CREATE TRIGGER fixture_e06_fail BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fixture_e06_fail()",
    );
    try {
      const response = await send(f.operator, input(f));
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.json.message).toBe(
        "Não foi possível concluir agora. Tente novamente.",
      );
      expect(JSON.stringify(body)).not.toContain("detalhe interno E06");
      await unchanged(f);
    } finally {
      await db.$executeRawUnsafe("DROP TRIGGER fixture_e06_fail ON audit_logs");
      await db.$executeRawUnsafe("DROP FUNCTION fixture_e06_fail()");
    }
    expect((await api(f.operator).requests.reject(input(f))).status).toBe(
      "REJECTED",
    );
  });

  it("relógio anterior à solicitação, inclusive microssegundos, não decide", async () => {
    const f = await fixture();
    await db.$executeRaw`UPDATE loan_requests SET requested_at = '2026-11-09T13:00:00.123456Z'::timestamptz WHERE id = ${f.request.id}::uuid`;
    await expect(
      rejectRequest(
        reader(f.operator),
        f.request.id,
        "Fixture",
        () => new Date("2026-11-09T13:00:00.123Z"),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await unchanged(f);
    expect(
      (
        await rejectRequest(
          reader(f.operator),
          f.request.id,
          "Fixture",
          () => new Date("2026-11-09T13:00:00.124Z"),
        )
      ).status,
    ).toBe("REJECTED");
  });

  it("lock ocupado não deixa rejeição parcial e libera tentativa posterior", async () => {
    const f = await fixture();
    let locked!: () => void, release!: () => void;
    const ready = new Promise<void>((resolve) => {
        locked = resolve;
      }),
      released = new Promise<void>((resolve) => {
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
        api(f.operator).requests.reject(input(f)),
      ).rejects.toMatchObject({ code: "CONFLICT" });
      await unchanged(f);
    } finally {
      release();
      await blocker;
    }
    expect((await api(f.operator).requests.reject(input(f))).status).toBe(
      "REJECTED",
    );
  });

  it("HTTP: motivo inválido 400, colaborador 403, rejeição 200 e repetição 409", async () => {
    const f = await fixture();
    expect((await send(f.operator, input(f, "  "))).status).toBe(400);
    expect((await send(f.own, input(f))).status).toBe(403);
    const response = await send(f.operator, input(f));
    expect(response.status).toBe(200);
    expect((await response.json()).result.data.json.status).toBe("REJECTED");
    const repeated = await send(f.secondOperator, input(f));
    expect(repeated.status).toBe(409);
    expect((await repeated.json()).error.json.data.code).toBe("CONFLICT");
  });
});
