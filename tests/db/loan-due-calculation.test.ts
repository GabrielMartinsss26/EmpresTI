import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { calculateLoanDueAt } from "../../src/server/services/loan-due-date";
import { startTestDatabase } from "./setup";

describe("CA-E07 — TypeScript e SQL concordam no PostgreSQL descartável", () => {
  let local: Awaited<ReturnType<typeof startTestDatabase>>;
  beforeAll(async () => {
    local = await startTestDatabase();
  });
  afterAll(async () => {
    await local?.db.$disconnect();
    await local?.container.stop();
  });

  it.each(["UTC", "Asia/Tokyo", "America/Sao_Paulo"])(
    "independe do fuso da sessão SQL: %s",
    async (zone) => {
      const starts = [
        "2026-11-09T13:00:00.567Z",
        "2026-11-06T13:00:00Z",
        "2026-11-07T13:00:00Z",
        "2026-11-08T13:00:00Z",
        "2026-11-30T23:30:00Z",
        "2026-12-21T13:00:00Z",
        "2026-11-10T01:30:00Z",
        "2028-02-14T13:00:00Z",
        "2018-10-22T13:00:00Z",
        "2019-02-04T12:00:00Z",
      ];
      await local.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT set_config('TimeZone', ${zone}, true)`;
        for (const value of starts) {
          const start = new Date(value);
          const [row] = await tx.$queryRaw<{ due: Date }[]>`
            SELECT public.loan_due_14_business_days_v1(${start}::timestamptz) AS due
          `;
          expect(calculateLoanDueAt(start).getTime(), value).toBe(
            row.due.getTime(),
          );
        }
      });
    },
  );
});
