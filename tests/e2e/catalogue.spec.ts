import { test, expect } from "./catalogue-fixture";

test("CA-E01/CA-E11: catálogo real com 12 fotos/créditos, três colunas e estados de manutenção", async ({
  page,
}) => {
  const violations: string[] = [];
  await page.addInitScript(() =>
    document.addEventListener("securitypolicyviolation", (event) =>
      console.error(`E07-CSP:${event.violatedDirective}`),
    ),
  );
  page.on("console", (message) => {
    if (message.text().startsWith("E07-CSP:")) violations.push(message.text());
  });
  await page.goto("/catalogo");
  await expect(
    page.getByRole("heading", { name: "Catálogo", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(12);
  await expect(page.getByText("0 de 3 itens com você")).toBeVisible();
  // CA-E11: limite visual e regra do catálogo preservados na sincronização E09.
  await expect(
    page.getByText("Até 3 equipamentos · 14 dias úteis após aprovação"),
  ).toBeVisible();
  await expect(
    page.locator('[aria-label="Limite de três equipamentos"] > span'),
  ).toHaveCount(3);
  for (const tag of ["TI-0004", "TI-0007", "TI-0010"])
    await expect(
      page
        .getByRole("article", { name: new RegExp(`^${tag}`) })
        .getByRole("button", { name: "Manutenção" }),
    ).toBeDisabled();
  await expect(page.getByRole("link", { name: /Foto:.*Pixabay/ })).toHaveCount(
    12,
  );
  for (const image of await page.getByRole("article").getByRole("img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
      )
      .toBe(800);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  const cards = await page.getByRole("article").evaluateAll((elements) =>
    elements.slice(0, 4).map((element) => ({
      x: element.getBoundingClientRect().x,
      y: element.getBoundingClientRect().y,
    })),
  );
  expect(cards[0].y).toBe(cards[1].y);
  expect(cards[1].y).toBe(cards[2].y);
  expect(cards[3].y).toBeGreaterThan(cards[0].y);
  expect(
    await page
      .locator("aside")
      .evaluate((element) => element.getBoundingClientRect().width),
  ).toBe(236);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(violations).toEqual([]);
  await page.screenshot({
    path: "test-results/e07-catalogue.png",
    fullPage: true,
  });
});

test("CA-E01: busca, categoria, disponíveis e estado vazio", async ({
  page,
}) => {
  await page.goto("/catalogo");
  await expect(page.getByRole("article")).toHaveCount(12);
  await page
    .getByRole("combobox", { name: "Categoria", exact: true })
    .selectOption({ label: "notebook" });
  await expect(page.getByRole("article")).toHaveCount(4);
  await page.getByLabel("Somente disponíveis").check();
  await expect(page.getByRole("article")).toHaveCount(3);
  await page
    .getByRole("combobox", { name: "Categoria", exact: true })
    .selectOption("");
  await page.getByLabel("Buscar equipamento").fill("TI-0012");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByLabel("Buscar equipamento").fill("inexistente");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Nenhum equipamento encontrado" }),
  ).toBeVisible();
});

test("CA-E02: diálogo acessível, envio sem repetição e pedido PENDING visível", async ({
  page,
  sandbox,
  user,
}) => {
  await page.goto("/catalogo");
  const card = page.getByRole("article", { name: /^TI-0001/ });
  const trigger = card.getByRole("button", { name: "Solicitar", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Solicitar equipamento" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText("O prazo de 14 dias úteis começa após a aprovação."),
  ).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancelar" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    dialog.getByRole("button", { name: "Confirmar solicitação" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await page.screenshot({ path: "test-results/e07-dialog.png" });
  await page.route("**/api/trpc/requests.create*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.continue();
  });
  await dialog
    .getByRole("button", { name: "Confirmar solicitação" })
    .evaluate((element) => {
      (element as HTMLButtonElement).click();
      (element as HTMLButtonElement).click();
    });
  await expect(
    dialog.getByRole("button", { name: "Enviando…" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("status").filter({ hasText: "Solicitação enviada." }),
  ).toBeVisible();
  expect(
    await sandbox.db.loanRequest.count({
      where: { requester_membership_id: user.id, status: "PENDING" },
    }),
  ).toBe(1);
  expect(
    await sandbox.db.loan.count({ where: { borrower_membership_id: user.id } }),
  ).toBe(0);
  await expect(
    card.getByRole("button", { name: "Pedido pendente" }),
  ).toBeDisabled();
  await page
    .getByRole("link", { name: "Meus empréstimos", exact: false })
    .click();
  await expect(
    page.getByRole("heading", { name: "Meus empréstimos", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Você não tem equipamentos emprestados."),
  ).toBeVisible();
  await expect(
    page.getByText("Aguardando aprovação. Ainda não há vencimento."),
  ).toBeVisible();
});

test("CA-E02: conflito atualiza catálogo e não mostra sucesso nem cria outro pedido", async ({
  page,
  sandbox,
  user,
}) => {
  await page.goto("/catalogo");
  const card = page.getByRole("article", { name: /^TI-0002/ });
  await card.getByRole("button", { name: "Solicitar", exact: true }).click();
  const other = await sandbox.member();
  const item = await sandbox.db.equipment.findUniqueOrThrow({
    where: {
      tenant_id_asset_tag: {
        tenant_id: sandbox.tenant.id,
        asset_tag: "TI-0002",
      },
    },
  });
  await sandbox.db.loanRequest.create({
    data: {
      tenant_id: sandbox.tenant.id,
      equipment_id: item.id,
      requester_membership_id: other.id,
    },
  });
  await page.getByRole("button", { name: "Confirmar solicitação" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "A disponibilidade mudou." }),
  ).toBeVisible();
  await expect(
    card.getByRole("button", { name: "Pedido pendente" }),
  ).toBeDisabled();
  expect(
    await sandbox.db.loanRequest.count({
      where: { requester_membership_id: user.id },
    }),
  ).toBe(0);
  await expect(
    page.getByText("Solicitação enviada.", { exact: false }),
  ).not.toBeVisible();
});

test("CA-E03: limite três e atraso desabilitam solicitação com motivo", async ({
  page,
  sandbox,
  user,
}) => {
  await sandbox.loan(user.id, "TI-0001");
  await sandbox.loan(user.id, "TI-0002");
  await sandbox.loan(user.id, "TI-0003");
  await page.goto("/catalogo");
  await expect(page.getByText("3 de 3 itens com você")).toBeVisible();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Você já está com 3 equipamentos." }),
  ).toBeVisible();
  for (const button of await page
    .getByRole("button", { name: "Solicitar", exact: true })
    .all())
    await expect(button).toBeDisabled();
  await sandbox.reset();
  await sandbox.loan(user.id, "TI-0001", "2020-01-06T13:00:00Z");
  await page.reload();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Você tem equipamento em atraso." }),
  ).toBeVisible();
});

test("CA-E09: empréstimos/datas reais, pedidos separados e motivo de rejeição", async ({
  page,
  sandbox,
  user,
}) => {
  const loan = await sandbox.loan(user.id, "TI-0001");
  const other = await sandbox.member();
  await sandbox.loan(other.id, "TI-0005");
  const equipment = await sandbox.db.equipment.findMany({
    where: { asset_tag: { in: ["TI-0002", "TI-0003"] } },
    orderBy: { asset_tag: "asc" },
  });
  await sandbox.db.loanRequest.create({
    data: {
      tenant_id: sandbox.tenant.id,
      equipment_id: equipment[0].id,
      requester_membership_id: user.id,
    },
  });
  await sandbox.db.loanRequest.create({
    data: {
      tenant_id: sandbox.tenant.id,
      equipment_id: equipment[1].id,
      requester_membership_id: user.id,
      status: "REJECTED",
      requested_at: new Date("2026-11-01T13:00:00Z"),
      decided_at: new Date("2026-11-02T13:00:00Z"),
      decided_by_membership_id: sandbox.operator.id,
      rejection_reason: "Sem unidade para esta solicitação.",
    },
  });
  await page.goto("/meus-emprestimos");
  const active = page.getByRole("region", { name: "Comigo agora" });
  await expect(active.getByRole("article")).toHaveCount(1);
  await expect(
    active.locator(`time[datetime="${loan.due_at.toISOString()}"]`),
  ).toHaveText("27/nov/2026 · 10:00");
  await expect(active.getByText("TI-0005", { exact: false })).not.toBeVisible();
  await expect(
    page.getByText("Motivo: Sem unidade para esta solicitação."),
  ).toBeVisible();
  await expect(
    page.getByText("Aguardando aprovação. Ainda não há vencimento."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Devolver/ })).toHaveCount(0);
  await page.screenshot({
    path: "test-results/e07-my-loans.png",
    fullPage: true,
  });
});

test("CA-E01/E09: erro de rede tem retry e imagem com falha tem fallback", async ({
  page,
  sandbox,
}) => {
  await page.route(`${sandbox.authUrl}/storage/**/TI-0001.webp`, (route) =>
    route.abort(),
  );
  await page.goto("/catalogo");
  await expect(page.getByRole("article")).toHaveCount(12);
  await expect(
    page
      .getByRole("article", { name: /^TI-0001/ })
      .getByText("Imagem indisponível"),
  ).toBeVisible();
  await page.route("**/api/trpc/**", (route) =>
    route.request().url().includes("catalogue.list")
      ? route.abort()
      : route.continue(),
  );
  await page.getByLabel("Buscar equipamento").fill("Notebook");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Não foi possível carregar agora." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Tentar novamente" }),
  ).toBeVisible();
  await page.unroute("**/api/trpc/**");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.getByRole("article")).toHaveCount(4);
});

test("CA-E01: paginação carrega itens adicionais sem duplicar", async ({
  page,
  sandbox,
}) => {
  const category = await sandbox.db.equipmentCategory.findFirstOrThrow();
  await sandbox.db.equipment.upsert({
    where: {
      tenant_id_asset_tag: {
        tenant_id: sandbox.tenant.id,
        asset_tag: "TI-0013",
      },
    },
    create: {
      tenant_id: sandbox.tenant.id,
      category_id: category.id,
      asset_tag: "TI-0013",
      name: "Unidade adicional de teste",
      pickup_location: "Operações",
    },
    update: { deactivated_at: null },
  });
  await page.goto("/catalogo");
  await expect(page.getByRole("article")).toHaveCount(12);
  await page
    .getByRole("button", { name: "Carregar mais equipamentos" })
    .click();
  await expect(page.getByRole("article")).toHaveCount(13);
  await expect(
    page.getByRole("button", { name: "Carregar mais equipamentos" }),
  ).not.toBeVisible();
});

test("CA-E09: sem sessão as duas rotas voltam ao login", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  for (const path of ["/catalogo", "/meus-emprestimos"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login$/);
  }
});
