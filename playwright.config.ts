import { defineConfig } from "@playwright/test";
const port = process.env.APP_MODE === "showcase" ? 3001 : 3000;
export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/playwright",
  use: {
    baseURL: `http://localhost:${port}`,
    viewport: { width: 1440, height: 820 },
  },
  webServer: process.argv.some(
    (arg) => arg.includes("catalogue.spec") || arg.includes("operations.spec"),
  )
    ? undefined
    : {
        command: `npm run start -- --port ${port}`,
        url: `http://localhost:${port}/login`,
        reuseExistingServer: process.env.APP_MODE !== "showcase",
        timeout: 120000,
      },
});
