import { test, expect } from "@playwright/test";
test.skip(
  process.env.APP_MODE === "showcase",
  "Login funcional usa configuração completa.",
);
test("entrada desktop, validação e proteção de rota", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Acessar sistema", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute(
    "type",
    "password",
  );
  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Informe um e-mail válido.")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const hero = await page
    .getByRole("region", { name: "Sobre o EmpresTI" })
    .boundingBox();
  expect(hero?.width).toBe(560);
  for (const viewport of [
    { width: 1440, height: 820 },
    { width: 1366, height: 768 },
    { width: 1280, height: 720 },
  ]) {
    await page.setViewportSize(viewport);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollHeight <= window.innerHeight &&
          document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Entrar", exact: true }),
    ).toBeInViewport();
  }
  await page.goto("/catalogo");
  await expect(page).toHaveURL(/\/login$/);
  const home = page.getByRole("link", {
    name: "EmpresTI — voltar à página inicial",
  });
  await expect(home).toHaveAttribute("href", "/");
  await home.locator("span").first().click();
  await expect(page).toHaveURL(/:\d+\/$/);
  await page.goto("/login");
  await home.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/:\d+\/$/);
});
test("credenciais inválidas exibem erro e estado de envio", async ({
  page,
}) => {
  await page.route("**/api/trpc/auth.login*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify([
        {
          error: {
            json: {
              message: "E-mail ou senha inválidos.",
              code: -32001,
              data: {
                code: "UNAUTHORIZED",
                httpStatus: 401,
                path: "auth.login",
              },
            },
          },
        },
      ]),
    });
  });
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
  await page.getByLabel("Senha", { exact: true }).fill("invalida");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Entrando…" })).toBeDisabled();
  await expect(
    page.getByRole("alert").filter({ hasText: "E-mail ou senha inválidos." }),
  ).toBeVisible();
});
