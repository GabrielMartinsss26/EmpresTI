import { test, expect } from "@playwright/test";

test.skip(
  process.env.APP_MODE !== "showcase",
  "Teste exclusivo da publicação visual.",
);
test("página inicial sem banco não envia credenciais nem libera área protegida", async ({
  page,
  request,
}) => {
  const calls: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes("/api/trpc")) calls.push(req.url());
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Equipamentos em ordem.",
  );
  await expect(
    page.getByRole("link", { name: "Acessar sistema", exact: true }).first(),
  ).toHaveAttribute("href", "/login");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/landing-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 820 });
  await page
    .getByRole("link", { name: "Acessar sistema", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Entrar", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Entrar", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText(
    "Demonstração da interface",
  );
  expect(calls).toEqual([]);
  await page.goto("/catalogo");
  await expect(page).toHaveURL(/\/login$/);
  expect((await request.get("/api/trpc/auth.me")).status()).toBe(503);
  expect(await (await request.get("/health")).json()).toEqual({
    status: "ok",
    mode: "showcase",
  });
});
