import { describe, expect, it, vi } from "vitest";
import {
  calculateLoanDueAt,
  createLoanPeriod,
} from "../../src/server/services/loan-due-date";

describe("CA-E07 — calendário de São Paulo", () => {
  it.each([
    ["segunda", "2026-11-09T13:00:00Z", "2026-11-27T13:00:00.000Z"],
    ["sexta", "2026-11-06T13:00:00Z", "2026-11-26T13:00:00.000Z"],
    ["sábado", "2026-11-07T13:00:00Z", "2026-11-26T13:00:00.000Z"],
    ["domingo", "2026-11-08T13:00:00Z", "2026-11-26T13:00:00.000Z"],
    ["mês", "2026-11-30T23:30:00Z", "2026-12-18T23:30:00.000Z"],
    ["ano/feriados", "2026-12-21T13:00:00Z", "2027-01-08T13:00:00.000Z"],
    ["data local", "2026-11-10T01:30:00Z", "2026-11-28T01:30:00.000Z"],
    ["milissegundos", "2026-11-09T13:12:34.567Z", "2026-11-27T13:12:34.567Z"],
    ["bissexto", "2028-02-14T13:00:00Z", "2028-03-03T13:00:00.000Z"],
    [
      "início DST histórico",
      "2018-10-22T13:00:00Z",
      "2018-11-09T12:00:00.000Z",
    ],
    ["fim DST histórico", "2019-02-04T12:00:00Z", "2019-02-22T13:00:00.000Z"],
  ])(
    "%s: exclui dia inicial e conserva horário local",
    (_, input, expected) => {
      const start = new Date(input);
      expect(calculateLoanDueAt(start).toISOString()).toBe(expected);
      expect(start.toISOString()).toBe(new Date(input).toISOString());
    },
  );

  it("rejeita data inválida", () => {
    expect(() => calculateLoanDueAt(new Date(NaN))).toThrow(RangeError);
  });

  it("não depende do fuso do processo", () => {
    try {
      for (const zone of ["UTC", "Asia/Tokyo", "America/Sao_Paulo"]) {
        vi.stubEnv("TZ", zone);
        expect(
          calculateLoanDueAt(new Date("2026-11-10T01:30:00Z")).toISOString(),
        ).toBe("2026-11-28T01:30:00.000Z");
      }
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("usa o relógio do servidor por padrão", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-11-09T13:00:00Z"));
      expect(createLoanPeriod().dueAt.toISOString()).toBe(
        "2026-11-27T13:00:00.000Z",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("captura o relógio uma vez e não compartilha Date mutável", () => {
    const now = new Date("2026-11-09T13:00:00Z");
    const clock = vi.fn(() => now);
    const period = createLoanPeriod(clock);
    expect(clock).toHaveBeenCalledTimes(1);
    expect(period.checkedOutAt.toISOString()).toBe("2026-11-09T13:00:00.000Z");
    expect(period.dueAt.toISOString()).toBe("2026-11-27T13:00:00.000Z");
    now.setTime(0);
    expect(period.checkedOutAt.getUTCFullYear()).toBe(2026);
  });
});
