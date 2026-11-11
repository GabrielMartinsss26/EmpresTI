import { test, expect, type Sandbox } from "./catalogue-fixture";
import superjson from "superjson";
import { randomUUID } from "node:crypto";

test.beforeEach(async ({ context, sandbox }) => {
  await context.addCookies([sandbox.cookie(sandbox.operator.user_id)]);
});

async function seed(sandbox: Sandbox, membershipId: string, tag = "TI-0001") {
  const item = await sandbox.db.equipment.findUniqueOrThrow({
    where: {
      tenant_id_asset_tag: { tenant_id: sandbox.tenant.id, asset_tag: tag },
    },
  });
  return sandbox.db.loanRequest.create({
    data: {
      tenant_id: sandbox.tenant.id,
      equipment_id: item.id,
      requester_membership_id: membershipId,
      requested_at: new Date("2026-11-01T13:00:00Z"),
    },
  });
}

for (const role of ["ADMIN", "OPERATIONS"] as const)
  test(`CA-E04/E10: ${role} acessa lista e link de Operações`, async ({
    page,
    sandbox,
    user,
    context,
  }) => {
    const actor = await sandbox.member(role);
    await context.addCookies([sandbox.cookie(actor.user_id)]);
    await seed(sandbox, user.id);
    await page.goto("/catalogo");
    await page.getByRole("link", { name: "Solicitações", exact: true }).click();
    await expect(page).toHaveURL(/\/operacoes\/solicitacoes$/);
    await expect(
      page.getByRole("heading", { name: "Solicitações pendentes" }),
    ).toBeVisible();
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
    await expect(
      page.getByRole("button", { name: "Aprovar", exact: true }),
    ).toBeEnabled();
  });

test("CA-E04/E10: colaborador não vê link nem dados por página/API; sem sessão vai ao login", async ({
  page,
  context,
  sandbox,
  user,
}) => {
  const target = await seed(sandbox, user.id);
  await context.addCookies([sandbox.cookie(user.user_id)]);
  await page.goto("/catalogo");
  await expect(
    page.getByRole("link", { name: "Meus empréstimos" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Solicitações", exact: true }),
  ).toHaveCount(0);
  await page.goto("/operacoes/solicitacoes");
  await expect(page).toHaveURL(/\/catalogo$/);
  const params = encodeURIComponent(
    JSON.stringify(superjson.serialize({ limit: 12 })),
  );
  const denied = await page.request.get(
    `${sandbox.url}/api/trpc/requests.pending?input=${params}`,
  );
  expect(denied.status()).toBe(403);
  expect((await denied.json()).error.json.data.code).toBe("FORBIDDEN");
  for (const method of ["approve", "reject"]) {
    const response = await page.request.post(
      `${sandbox.url}/api/trpc/requests.${method}`,
      {
        headers: { Origin: sandbox.url },
        data: superjson.serialize({
          requestId: target.id,
          ...(method === "reject" ? { reason: "Fixture" } : {}),
        }),
      },
    );
    expect(response.status()).toBe(403);
    expect((await response.json()).error.json.data.code).toBe("FORBIDDEN");
  }
  await context.clearCookies();
  await page.goto("/operacoes/solicitacoes");
  await expect(page).toHaveURL(/\/login$/);
});

test("CA-E05/E10: confirmação acessível e aprovação única com prazo real", async ({
  page,
  sandbox,
  user,
}) => {
  const target = await seed(sandbox, user.id);
  await page.goto("/operacoes/solicitacoes");
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Aprovar solicitação",
    exact: true,
  });
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Confirmar aprovação" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  expect(
    (
      await sandbox.db.loanRequest.findUniqueOrThrow({
        where: { id: target.id },
      })
    ).status,
  ).toBe("PENDING");
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await page.screenshot({ path: "test-results/e08-approve.png" });
  await page.route("**/api/trpc/requests.approve*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await dialog
    .getByRole("button", { name: "Confirmar aprovação" })
    .evaluate((button) => {
      (button as HTMLButtonElement).click();
      (button as HTMLButtonElement).click();
    });
  await expect(
    dialog.getByRole("button", { name: "Registrando…" }),
  ).toBeDisabled();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Solicitação aprovada. Devolver até" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nenhuma solicitação pendente" }),
  ).toBeVisible();
  expect(
    await sandbox.db.loan.count({ where: { loan_request_id: target.id } }),
  ).toBe(1);
  expect(
    await sandbox.db.auditLog.count({
      where: { resource_id: target.id, action: "loan_request.approved" },
    }),
  ).toBe(1);
  expect(
    (
      await sandbox.db.loan.findUniqueOrThrow({
        where: { loan_request_id: target.id },
      })
    ).due_rule,
  ).toBe("BUSINESS_14_SP");
});

test("CA-E08/E10: rejeição exige motivo, preserva texto e libera novo pedido", async ({
  page,
  sandbox,
  user,
  context,
}) => {
  const target = await seed(sandbox, user.id);
  await page.goto("/operacoes/solicitacoes");
  await page.getByRole("button", { name: "Rejeitar", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: "Rejeitar solicitação",
    exact: true,
  });
  await dialog.getByRole("button", { name: "Confirmar rejeição" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Informe o motivo da rejeição.",
  );
  const reason = dialog.getByLabel("Motivo da rejeição");
  await expect(reason).toBeFocused();
  await expect(reason).toHaveAttribute("maxlength", "500");
  await reason.fill("  Sem disponibilidade para esta solicitação.  ");
  await page.screenshot({ path: "test-results/e08-reject.png" });
  await dialog.getByRole("button", { name: "Confirmar rejeição" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Solicitação rejeitada." }),
  ).toBeVisible();
  expect(
    await sandbox.db.loan.count({ where: { loan_request_id: target.id } }),
  ).toBe(0);
  expect(
    (
      await sandbox.db.loanRequest.findUniqueOrThrow({
        where: { id: target.id },
      })
    ).rejection_reason,
  ).toBe("Sem disponibilidade para esta solicitação.");
  await context.addCookies([sandbox.cookie(user.user_id)]);
  await page.goto("/meus-emprestimos");
  await expect(
    page.getByText("Motivo: Sem disponibilidade para esta solicitação."),
  ).toBeVisible();
  await page.goto("/catalogo");
  const card = page.getByRole("article", { name: /^TI-0001/ });
  await card.getByRole("button", { name: "Solicitar", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar solicitação" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Solicitação enviada." }),
  ).toBeVisible();
  expect(
    await sandbox.db.loanRequest.count({
      where: { equipment_id: target.equipment_id, status: "PENDING" },
    }),
  ).toBe(1);
});

test("CA-E05/E10: decisão concorrente gera conflito visível sem falso sucesso", async ({
  page,
  sandbox,
  user,
}) => {
  const target = await seed(sandbox, user.id);
  await page.goto("/operacoes/solicitacoes");
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await sandbox.db.loanRequest.update({
    where: { id: target.id },
    data: {
      status: "REJECTED",
      decided_at: new Date(),
      decided_by_membership_id: sandbox.operator.id,
      rejection_reason: "Decisão concorrente de teste",
    },
  });
  await page.getByRole("button", { name: "Confirmar aprovação" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Esta solicitação já foi decidida." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nenhuma solicitação pendente" }),
  ).toBeVisible();
  expect(
    await sandbox.db.loan.count({ where: { loan_request_id: target.id } }),
  ).toBe(0);
});

test("CA-E06/E10: limite revalidado exibe erro e mantém pedido pendente", async ({
  page,
  sandbox,
  user,
}) => {
  const target = await seed(sandbox, user.id, "TI-0005");
  await sandbox.loan(user.id, "TI-0001");
  await sandbox.loan(user.id, "TI-0002");
  await sandbox.loan(user.id, "TI-0003");
  await page.goto("/operacoes/solicitacoes");
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar aprovação" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Você já está com 3 equipamentos." }),
  ).toBeVisible();
  expect(
    (
      await sandbox.db.loanRequest.findUniqueOrThrow({
        where: { id: target.id },
      })
    ).status,
  ).toBe("PENDING");
  expect(
    await sandbox.db.loan.count({ where: { loan_request_id: target.id } }),
  ).toBe(0);
});

test("CA-E04/E10: papel revogado fecha acesso sem manter linhas antigas", async ({
  page,
  sandbox,
  user,
}) => {
  const target = await seed(sandbox, user.id);
  await page.goto("/operacoes/solicitacoes");
  await page.getByRole("button", { name: "Aprovar", exact: true }).click();
  await sandbox.db.membership.update({
    where: { id: sandbox.operator.id },
    data: { role: "COLLABORATOR" },
  });
  try {
    await page.getByRole("button", { name: "Confirmar aprovação" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Você não tem permissão para decidir" }),
    ).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(
      page.getByRole("link", { name: "Solicitações", exact: true }),
    ).toHaveCount(0);
    expect(
      (
        await sandbox.db.loanRequest.findUniqueOrThrow({
          where: { id: target.id },
        })
      ).status,
    ).toBe("PENDING");
  } finally {
    await sandbox.db.membership.update({
      where: { id: sandbox.operator.id },
      data: { role: "ADMIN" },
    });
  }
});

test("CA-E04/E10: não lista nem decide pedido de outra organização", async ({
  page,
  sandbox,
  user,
}) => {
  await seed(sandbox, user.id);
  const other = await sandbox.db.tenant.create({
    data: { slug: randomUUID(), name: "Organização externa sintética" },
  });
  const member = await sandbox.db.membership.create({
    data: { tenant_id: other.id, user_id: user.user_id, role: "COLLABORATOR" },
  });
  const category = await sandbox.db.equipmentCategory.create({
    data: { tenant_id: other.id, name: "Fixture" },
  });
  const equipment = await sandbox.db.equipment.create({
    data: {
      tenant_id: other.id,
      category_id: category.id,
      asset_tag: "EXTERNO-001",
      name: "Equipamento externo",
      pickup_location: "Fixture",
    },
  });
  const request = await sandbox.db.loanRequest.create({
    data: {
      tenant_id: other.id,
      equipment_id: equipment.id,
      requester_membership_id: member.id,
    },
  });
  await page.goto("/operacoes/solicitacoes");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(2);
  await expect(
    page.getByText("EXTERNO-001", { exact: false }),
  ).not.toBeVisible();
  const denied = await page.request.post(
    `${sandbox.url}/api/trpc/requests.approve`,
    {
      headers: { Origin: sandbox.url },
      data: superjson.serialize({ requestId: request.id }),
    },
  );
  expect(denied.status()).toBe(404);
  expect((await denied.json()).error.json.data.code).toBe("NOT_FOUND");
  expect(
    (
      await sandbox.db.loanRequest.findUniqueOrThrow({
        where: { id: request.id },
      })
    ).status,
  ).toBe("PENDING");
});

test("CA-E10: carregamento, vazio e erro de rede com retry", async ({
  page,
}) => {
  await page.route("**/api/trpc/**", async (route) => {
    if (route.request().url().includes("requests.pending"))
      await new Promise((resolve) => setTimeout(resolve, 300));
    await route.continue();
  });
  await page.goto("/operacoes/solicitacoes");
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Carregando solicitações pendentes…" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nenhuma solicitação pendente" }),
  ).toBeVisible();
  await page.unroute("**/api/trpc/**");
  await page.route("**/api/trpc/**", (route) =>
    route.request().url().includes("requests.pending")
      ? route.abort()
      : route.continue(),
  );
  await page.getByRole("button", { name: "Atualizar lista" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Não foi possível carregar agora." }),
  ).toBeVisible();
  await page.unroute("**/api/trpc/**");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhuma solicitação pendente" }),
  ).toBeVisible();
});

test("CA-E10: lista paginada sem repetição e visual desktop", async ({
  page,
  sandbox,
  user,
}) => {
  const category = await sandbox.db.equipmentCategory.findFirstOrThrow({
    where: { tenant_id: sandbox.tenant.id },
  });
  for (let i = 0; i < 13; i++) {
    const asset_tag = `OPS-${i}`;
    const item = await sandbox.db.equipment.upsert({
      where: {
        tenant_id_asset_tag: { tenant_id: sandbox.tenant.id, asset_tag },
      },
      create: {
        tenant_id: sandbox.tenant.id,
        category_id: category.id,
        asset_tag,
        name: `Unidade de teste ${i}`,
        pickup_location: "Operações",
      },
      update: { deactivated_at: null },
    });
    await sandbox.db.loanRequest.create({
      data: {
        tenant_id: sandbox.tenant.id,
        equipment_id: item.id,
        requester_membership_id: user.id,
        requested_at: new Date("2026-11-01T13:00:00Z"),
      },
    });
  }
  await page.goto("/operacoes/solicitacoes");
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(13);
  await page
    .getByRole("button", { name: "Carregar mais solicitações" })
    .click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(14);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/e08-operations.png",
    fullPage: true,
  });
});

test("CA-E05/E10: falha real na auditoria não mostra sucesso nem deixa empréstimo", async ({
  page,
  sandbox,
  user,
}) => {
  const target = await seed(sandbox, user.id);
  await sandbox.db.$executeRawUnsafe(
    "CREATE FUNCTION fixture_e08_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'falha E08'; END; $$",
  );
  await sandbox.db.$executeRawUnsafe(
    "CREATE TRIGGER fixture_e08_fail BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION fixture_e08_fail()",
  );
  try {
    await page.goto("/operacoes/solicitacoes");
    await page.getByRole("button", { name: "Aprovar", exact: true }).click();
    await page.getByRole("button", { name: "Confirmar aprovação" }).click();
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "Não foi possível concluir agora." }),
    ).toBeVisible();
    expect(
      (
        await sandbox.db.loanRequest.findUniqueOrThrow({
          where: { id: target.id },
        })
      ).status,
    ).toBe("PENDING");
    expect(
      await sandbox.db.loan.count({ where: { loan_request_id: target.id } }),
    ).toBe(0);
  } finally {
    await sandbox.db.$executeRawUnsafe(
      "DROP TRIGGER fixture_e08_fail ON audit_logs",
    );
    await sandbox.db.$executeRawUnsafe("DROP FUNCTION fixture_e08_fail()");
  }
});
