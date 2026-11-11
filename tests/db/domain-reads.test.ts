import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Equipment, Membership, PrismaClient } from "@prisma/client";
import { randomUUID } from "node:crypto";
import superjson from "superjson";

const session = vi.hoisted(() => ({
  db: null as PrismaClient | null,
  userId: null as string | null,
}));
vi.mock("server-only", () => ({}));
vi.mock("../../src/server/services/login", () => ({ login: vi.fn() }));
vi.mock("../../src/server/db", () => ({
  get db() {
    return session.db;
  },
}));
vi.mock("../../src/server/auth", () => ({
  createAuthClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: session.userId ? { id: session.userId } : null },
      }),
    },
  }),
}));

import { appRouter } from "../../src/server/api/root";
import type { createContext } from "../../src/server/api/trpc";
import { GET, POST } from "../../src/app/api/trpc/[trpc]/route";
import { login } from "../../src/server/services/login";
import { loanSummary } from "../../src/server/services/loans";
import { calculateLoanDueAt } from "../../src/server/services/loan-due-date";
import { startTestDatabase } from "./setup";

type Context = Awaited<ReturnType<typeof createContext>>;
let local: Awaited<ReturnType<typeof startTestDatabase>>;
let db: PrismaClient;
type Fixture = Awaited<ReturnType<typeof fixture>>;
let a: Fixture, b: Fixture;

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
async function person(
  tenantId: string,
  role: Membership["role"] = "COLLABORATOR",
) {
  const id = randomUUID();
  await db.$executeRaw`INSERT INTO auth.users (id) VALUES (${id}::uuid)`;
  await db.profile.create({ data: { id, full_name: "Pessoa sintética E03" } });
  return db.membership.create({
    data: { tenant_id: tenantId, user_id: id, role },
  });
}
async function fixture(slug: string) {
  const tenant = await db.tenant.create({
    data: { slug, name: "Organização sintética E03" },
  });
  const own = await person(tenant.id);
  const other = await person(tenant.id);
  const operator = await person(tenant.id, "OPERATIONS");
  const category = await db.equipmentCategory.create({
    data: { tenant_id: tenant.id, name: "Notebooks" },
  });
  const equipment: Equipment[] = [];
  for (let i = 1; i <= 12; i++) {
    const item = await db.equipment.create({
      data: {
        tenant_id: tenant.id,
        category_id: category.id,
        name: `Notebook ${i}`,
        asset_tag: `TI-${String(i).padStart(4, "0")}`,
        pickup_location: "Operações",
        operational_status: [4, 7, 10].includes(i)
          ? "MAINTENANCE"
          : "AVAILABLE",
      },
    });
    equipment.push(item);
    await db.equipmentImage.create({
      data: {
        tenant_id: tenant.id,
        equipment_id: item.id,
        storage_bucket: "equipamentos",
        object_path: `${slug}/${item.asset_tag}.webp`,
        source_provider: "Pixabay",
        source_id: BigInt(i),
        source_author_id: 456n,
        source_author: "Autor sintético",
        source_page_url: `https://pixabay.com/photos/fixture-${i}/`,
        license_name: "Pixabay Content License",
        license_url: "https://pixabay.com/service/license-summary/",
        media_kind: "photo",
        mime_type: "image/webp",
        width: 800,
        height: 600,
        size_bytes: 4096,
        source_sha256: "a".repeat(64),
        sha256: "b".repeat(64),
        reviewed_at: new Date(),
        reviewed_by: "Fixture",
        review_note: "Apenas metadados sintéticos, sem foto real",
      },
    });
  }
  async function request(
    index: number,
    member: Membership,
    status: "PENDING" | "APPROVED" | "REJECTED",
  ) {
    return db.loanRequest.create({
      data: {
        tenant_id: tenant.id,
        equipment_id: equipment[index].id,
        requester_membership_id: member.id,
        status,
        requested_at: new Date("2026-11-01T13:00:00Z"),
        ...(status === "PENDING"
          ? {}
          : {
              decided_at: new Date("2026-11-02T13:00:00Z"),
              decided_by_membership_id: operator.id,
            }),
        ...(status === "REJECTED"
          ? { rejection_reason: "Motivo sintético" }
          : {}),
      },
    });
  }
  async function loan(
    index: number,
    member: Membership,
    start: string,
    returned = false,
  ) {
    const req = await request(index, member, "APPROVED");
    const checkedOut = new Date(start);
    await db.loanRequest.update({
      where: { id: req.id },
      data: { requested_at: checkedOut, decided_at: checkedOut },
    });
    return db.loan.create({
      data: {
        tenant_id: tenant.id,
        loan_request_id: req.id,
        equipment_id: equipment[index].id,
        borrower_membership_id: member.id,
        approved_by_membership_id: operator.id,
        checked_out_at: checkedOut,
        due_at: calculateLoanDueAt(checkedOut),
        ...(returned
          ? {
              return_requested_at: new Date("2020-02-01T13:00:00Z"),
              returned_at: new Date("2020-02-02T13:00:00Z"),
              returned_by_membership_id: operator.id,
            }
          : {}),
      },
    });
  }
  const active = await loan(0, own, "2100-01-04T13:00:00Z");
  const foreignLoan = await loan(1, other, "2020-01-06T13:00:00Z");
  const pending = await request(2, own, "PENDING");
  const rejected = await request(4, own, "REJECTED");
  const returned = await loan(5, own, "2020-01-06T13:00:00Z", true);
  const overdue = await loan(7, own, "2020-01-06T13:00:00Z");
  const tied = await loan(8, own, "2100-01-04T13:00:00Z");
  const foreignRequest = await request(10, other, "PENDING");
  const inactiveCategory = await db.equipmentCategory.create({
    data: {
      tenant_id: tenant.id,
      name: "Desativada",
      deactivated_at: new Date(),
    },
  });
  await db.equipment.create({
    data: {
      tenant_id: tenant.id,
      category_id: category.id,
      asset_tag: "TI-0013",
      name: "Oculto",
      pickup_location: "Operações",
      deactivated_at: new Date(),
    },
  });
  await db.equipment.create({
    data: {
      tenant_id: tenant.id,
      category_id: inactiveCategory.id,
      asset_tag: "TI-0014",
      name: "Categoria oculta",
      pickup_location: "Operações",
    },
  });
  return {
    tenant,
    own,
    other,
    operator,
    category,
    equipment,
    active,
    foreignLoan,
    pending,
    rejected,
    returned,
    overdue,
    tied,
    foreignRequest,
  };
}

beforeAll(async () => {
  local = await startTestDatabase();
  db = local.db;
  session.db = db;
  a = await fixture("suporte_ti");
  b = await fixture("outro_tenant");
  session.userId = a.own.user_id;
});
afterAll(async () => {
  await db?.$disconnect();
  await local?.container.stop();
});

describe("CA-E01/E09 — consultas tRPC com PostgreSQL real", () => {
  it("catálogo contém 12 itens/fotos, três em manutenção e disponibilidade derivada sem dados de pessoas", async () => {
    const result = await api(a.own).catalogue.list({});
    expect(result.items).toHaveLength(12);
    expect(result.nextCursor).toBeNull();
    expect(result.items.map((item) => item.asset_tag)).toEqual(
      a.equipment.map((item) => item.asset_tag),
    );
    expect(
      result.items
        .filter((item) => item.availability === "MAINTENANCE")
        .map((item) => item.asset_tag),
    ).toEqual(["TI-0004", "TI-0007", "TI-0010"]);
    expect(
      result.items.every(
        (item) => item.image?.source_author === "Autor sintético",
      ),
    ).toBe(true);
    expect(result.items[0].availability).toBe("LOANED");
    expect(result.items[2].availability).toBe("PENDING");
    expect(result.items[5].availability).toBe("AVAILABLE");
    for (const forbidden of [
      "borrower",
      "requester",
      "loans",
      "requests",
      "tenant_id",
      "reviewed_by",
      "sha256",
    ]) {
      expect(JSON.stringify(result)).not.toContain(`"${forbidden}"`);
    }
  });

  it("catálogo de A não retorna itens/fotos de B e vice-versa, inclusive com filtro/cursor de B", async () => {
    const firstA = await api(a.own).catalogue.list({ limit: 1 });
    const firstB = await api(b.own).catalogue.list({ limit: 1 });
    expect(firstA.items[0].id).toBe(a.equipment[0].id);
    expect(firstB.items[0].id).toBe(b.equipment[0].id);
    expect(
      await api(a.own).catalogue.list({ categoryId: b.category.id }),
    ).toEqual({ items: [], nextCursor: null });
    await expect(
      api(a.own).catalogue.list({ cursor: firstB.items[0].id }),
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: "Página inválida. Atualize a lista.",
    });
  });

  it("categorias isoladas, ativas e sem campos internos", async () => {
    expect(await api(a.own).catalogue.categories()).toEqual([
      { id: a.category.id, name: "Notebooks" },
    ]);
    expect(await api(b.own).catalogue.categories()).toEqual([
      { id: b.category.id, name: "Notebooks" },
    ]);
  });

  it("busca por nome/patrimônio, categoria e filtro só disponíveis", async () => {
    expect(
      (await api(a.own).catalogue.list({ search: " ti-0012 " })).items.map(
        (item) => item.id,
      ),
    ).toEqual([a.equipment[11].id]);
    expect(
      (
        await api(a.own).catalogue.list({
          search: "NOTEBOOK",
          categoryId: a.category.id,
        })
      ).items,
    ).toHaveLength(12);
    expect(
      (await api(a.own).catalogue.list({ onlyAvailable: true })).items.map(
        (item) => item.asset_tag,
      ),
    ).toEqual(["TI-0005", "TI-0006", "TI-0012"]);
    expect(
      (await api(a.own).catalogue.list({ search: "inexistente" })).items,
    ).toEqual([]);
  });

  it("paginação do catálogo percorre todos sem repetir e recusa cursor fora dos filtros", async () => {
    const ids: string[] = [];
    let cursor: string | undefined;
    do {
      const result = await api(a.own).catalogue.list({ limit: 5, cursor });
      ids.push(...result.items.map((item) => item.id));
      cursor = result.nextCursor ?? undefined;
    } while (cursor);
    expect(ids).toEqual(a.equipment.map((item) => item.id));
    await expect(
      api(a.own).catalogue.list({
        onlyAvailable: true,
        cursor: a.equipment[0].id,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("resumo só conta ativos próprios, incluindo devolução solicitada; limite três e atraso real", async () => {
    expect(await api(a.own).loans.summary()).toEqual({
      activeCount: 3,
      maxActive: 3,
      hasOverdue: true,
    });
    expect(await api(a.other).loans.summary()).toEqual({
      activeCount: 1,
      maxActive: 3,
      hasOverdue: true,
    });
    expect(await api(b.own).loans.summary()).toEqual({
      activeCount: 3,
      maxActive: 3,
      hasOverdue: true,
    });
    expect(await api(a.operator).loans.summary()).toEqual({
      activeCount: 0,
      maxActive: 3,
      hasOverdue: false,
    });
    const reader = {
      db,
      userId: a.other.user_id,
      membershipId: a.other.id,
      tenantId: a.tenant.id,
    };
    expect(
      (await loanSummary(reader, () => a.foreignLoan.due_at)).hasOverdue,
    ).toBe(false);
    expect(
      (
        await loanSummary(
          reader,
          () => new Date(a.foreignLoan.due_at.getTime() + 1),
        )
      ).hasOverdue,
    ).toBe(true);
    await db.loan.update({
      where: { id: a.active.id },
      data: { return_requested_at: new Date("2100-01-05T13:00:00Z") },
    });
    try {
      expect((await api(a.own).loans.summary()).activeCount).toBe(3);
    } finally {
      await db.loan.update({
        where: { id: a.active.id },
        data: { return_requested_at: null },
      });
    }
  });

  it("empréstimos isolam pessoa/tenant, excluem devolvidos e mantêm due_at real", async () => {
    const result = await api(a.own).loans.mine({});
    expect(new Set(result.items.map((item) => item.id))).toEqual(
      new Set([a.active.id, a.tied.id, a.overdue.id]),
    );
    expect(
      result.items.find((item) => item.id === a.active.id)?.due_at,
    ).toEqual(a.active.due_at);
    expect(
      (await api(a.other).loans.mine({})).items.map((item) => item.id),
    ).toEqual([a.foreignLoan.id]);
    expect(
      (await api(b.other).loans.mine({})).items.map((item) => item.id),
    ).toEqual([b.foreignLoan.id]);
    for (const cursor of [
      a.foreignLoan.id,
      b.active.id,
      a.returned.id,
      randomUUID(),
    ]) {
      await expect(api(a.own).loans.mine({ cursor })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
  });

  it("pedidos próprios incluem decisões e motivo, sem vencimento inventado e sem pedidos de outros", async () => {
    const own = await api(a.own).requests.mine({});
    expect(own.items).toHaveLength(6);
    expect(
      own.items.find((item) => item.id === a.rejected.id)?.rejection_reason,
    ).toBe("Motivo sintético");
    expect(
      own.items.find((item) => item.id === a.pending.id)?.decided_at,
    ).toBeNull();
    expect(
      own.items.every(
        (item) => !("due_at" in item) && !("requester_membership_id" in item),
      ),
    ).toBe(true);
    expect((await api(a.other).requests.mine({})).items).toHaveLength(2);
    expect(
      (await api(b.own).requests.mine({})).items.every((item) =>
        own.items.every((other) => other.id !== item.id),
      ),
    ).toBe(true);
    for (const cursor of [a.foreignRequest.id, b.pending.id, randomUUID()]) {
      await expect(api(a.own).requests.mine({ cursor })).rejects.toMatchObject({
        code: "BAD_REQUEST",
      });
    }
  });

  it("paginação própria desempata datas iguais por ID, sem omitir/repetir", async () => {
    for (const kind of ["loans", "requests"] as const) {
      const ids: string[] = [];
      let cursor: string | undefined;
      do {
        const result = await api(a.own)[kind].mine({ limit: 1, cursor });
        ids.push(...result.items.map((item) => item.id));
        cursor = result.nextCursor ?? undefined;
      } while (cursor);
      const full = await api(a.own)[kind].mine({});
      expect(ids).toEqual(full.items.map((item) => item.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("paginação de pedidos preserva comparação SQL com microssegundos distintos", async () => {
    const first = await db.loanRequest.create({
      data: {
        tenant_id: a.tenant.id,
        equipment_id: a.equipment[11].id,
        requester_membership_id: a.operator.id,
        status: "REJECTED",
        requested_at: new Date("2026-11-01T13:00:00Z"),
        rejection_reason: "Fixture",
        decided_at: new Date(),
        decided_by_membership_id: a.operator.id,
      },
    });
    const second = await db.loanRequest.create({
      data: {
        tenant_id: a.tenant.id,
        equipment_id: a.equipment[11].id,
        requester_membership_id: a.operator.id,
        status: "REJECTED",
        requested_at: new Date("2026-11-01T13:00:00Z"),
        rejection_reason: "Fixture",
        decided_at: new Date(),
        decided_by_membership_id: a.operator.id,
      },
    });
    await db.$executeRaw`UPDATE loan_requests SET requested_at = '2026-11-01T13:00:00.123456Z'::timestamptz WHERE id = ${first.id}::uuid`;
    await db.$executeRaw`UPDATE loan_requests SET requested_at = '2026-11-01T13:00:00.123455Z'::timestamptz WHERE id = ${second.id}::uuid`;
    const one = await api(a.operator).requests.mine({ limit: 1 });
    const two = await api(a.operator).requests.mine({
      limit: 1,
      cursor: one.nextCursor!,
    });
    expect(one.items.map((item) => item.id)).toEqual([first.id]);
    expect(two.items.map((item) => item.id)).toEqual([second.id]);
    expect(two.nextCursor).toBeNull();
  });

  it("equipamento desativado não apaga empréstimo ativo próprio; imagem inativa não é exposta", async () => {
    await db.equipment.update({
      where: { id: a.equipment[0].id },
      data: { deactivated_at: new Date() },
    });
    await db.equipmentImage.update({
      where: { equipment_id: a.equipment[11].id },
      data: { deactivated_at: new Date() },
    });
    try {
      expect(
        (await api(a.own).loans.mine({})).items.some(
          (item) => item.id === a.active.id,
        ),
      ).toBe(true);
      const catalog = await api(a.own).catalogue.list({});
      expect(catalog.items.some((item) => item.id === a.equipment[0].id)).toBe(
        false,
      );
      expect(
        catalog.items.find((item) => item.id === a.equipment[11].id)?.image,
      ).toBeNull();
    } finally {
      await db.equipment.update({
        where: { id: a.equipment[0].id },
        data: { deactivated_at: null },
      });
      await db.equipmentImage.update({
        where: { equipment_id: a.equipment[11].id },
        data: { deactivated_at: null },
      });
    }
  });

  const queries = [
    (client: ReturnType<typeof api>) => client.catalogue.list({}),
    (client: ReturnType<typeof api>) => client.catalogue.categories(),
    (client: ReturnType<typeof api>) => client.loans.summary(),
    (client: ReturnType<typeof api>) => client.loans.mine({}),
    (client: ReturnType<typeof api>) => client.requests.mine({}),
  ];
  it.each(queries.map((query, index) => [index, query] as const))(
    "consulta %s nega sessão ausente/vínculo ausente/contexto incompatível",
    async (_, query) => {
      await expect(query(api(null))).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
      await expect(query(api(null, a.own.user_id))).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(query(api(a.own, a.other.user_id))).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      await expect(
        query(api({ ...a.own, tenant_id: b.tenant.id })),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    },
  );

  it.each(["membership", "profile", "tenant"] as const)(
    "revalida %s desativado depois da sessão, nas cinco consultas",
    async (kind) => {
      const update = (date: Date | null) =>
        kind === "membership"
          ? db.membership.update({
              where: { id: a.own.id },
              data: { deactivated_at: date },
            })
          : kind === "profile"
            ? db.profile.update({
                where: { id: a.own.user_id },
                data: { deactivated_at: date },
              })
            : db.tenant.update({
                where: { id: a.tenant.id },
                data: { deactivated_at: date },
              });
      await update(new Date());
      try {
        for (const query of queries)
          await expect(query(api(a.own))).rejects.toMatchObject({
            code: "FORBIDDEN",
          });
      } finally {
        await update(null);
      }
    },
  );

  it("valida limites/busca/UUID e rejeita input com pessoa/tenant", async () => {
    for (const input of [
      { limit: 0 },
      { limit: 49 },
      { limit: 1.5 },
      { cursor: "x" },
      { tenantId: b.tenant.id },
      { membershipId: a.other.id },
      { userId: a.other.user_id },
    ]) {
      for (const query of [
        api(a.own).catalogue.list,
        api(a.own).loans.mine,
        api(a.own).requests.mine,
      ]) {
        await expect(query(input as never)).rejects.toMatchObject({
          code: "BAD_REQUEST",
        });
      }
    }
    await expect(
      api(a.own).catalogue.list({ search: "a".repeat(81) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api(a.own).catalogue.categories({ tenantId: b.tenant.id } as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      api(a.own).loans.summary({ userId: a.other.user_id } as never),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("RLS nega leitura direta das tabelas consultadas para authenticated sem owner", async () => {
    await db.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        "GRANT USAGE ON SCHEMA public TO authenticated",
      );
      await tx.$executeRawUnsafe(
        "GRANT SELECT ON equipment, equipment_images, equipment_categories, loans, loan_requests TO authenticated",
      );
      await tx.$executeRawUnsafe("SET LOCAL ROLE authenticated");
      for (const table of [
        "equipment",
        "equipment_images",
        "equipment_categories",
        "loans",
        "loan_requests",
      ]) {
        expect(await tx.$queryRawUnsafe(`SELECT id FROM ${table}`)).toEqual([]);
      }
      await tx.$executeRawUnsafe("RESET ROLE");
      await tx.$executeRawUnsafe(
        "REVOKE SELECT ON equipment, equipment_images, equipment_categories, loans, loan_requests FROM authenticated",
      );
    });
  });

  async function http(path: string, input?: unknown) {
    const url = new URL(`http://localhost/api/trpc/${path}`);
    if (input !== undefined)
      url.searchParams.set("input", JSON.stringify(superjson.serialize(input)));
    return GET(new Request(url));
  }
  it("endpoint HTTP real usa sessão simulada, resposta 200 e cache privado; ausência de sessão retorna 401", async () => {
    session.userId = a.own.user_id;
    const response = await http("catalogue.list", {});
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    const body = await response.json();
    expect(body.result.data.json.items).toHaveLength(12);
    expect(body.result.data.json.items[0].id).toBe(a.equipment[0].id);
    session.userId = null;
    try {
      const denied = await http("loans.summary");
      expect(denied.status).toBe(401);
      expect((await denied.json()).error.json.data.code).toBe("UNAUTHORIZED");
    } finally {
      session.userId = a.own.user_id;
    }
  });

  it("formatter oculta falha interna do domínio", async () => {
    const spy = vi.spyOn(db.membership, "findFirst");
    // Primeira busca resolve o contexto; segunda é a revalidação do service.
    spy.mockResolvedValueOnce({ ...a.own, profile: {}, tenant: {} } as never);
    spy.mockRejectedValueOnce(new Error("detalhe interno que não deve sair"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await http("catalogue.list", {});
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.json.message).toBe(
        "Não foi possível concluir agora. Tente novamente.",
      );
      expect(JSON.stringify(body)).not.toContain("detalhe interno");
      expect(
        superjson.deserialize<{ data: { stack?: string } }>(body.error).data
          .stack,
      ).toBeUndefined();
    } finally {
      spy.mockRestore();
      log.mockRestore();
    }
  });

  it("formatter preserva erro genérico de login no endpoint HTTP", async () => {
    vi.mocked(login).mockRejectedValueOnce(new Error("segredo sintético"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await POST(
        new Request("http://localhost/api/trpc/auth.login", {
          method: "POST",
          headers: {
            Origin: "http://localhost",
            Host: "localhost",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            superjson.serialize({
              email: "fixture@example.com",
              password: "senha-sintetica",
            }),
          ),
        }),
      );
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error.json.message).toBe(
        "Não foi possível entrar agora. Tente novamente.",
      );
      expect(JSON.stringify(body)).not.toContain("segredo sintético");
    } finally {
      log.mockRestore();
    }
  });
});
