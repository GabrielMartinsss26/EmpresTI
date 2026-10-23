import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/db/**/*.test.ts"],
    environment: "node",
    testTimeout: 120000,
    hookTimeout: 120000,
    fileParallelism: false,
  },
});
