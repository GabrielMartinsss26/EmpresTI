const timeZone = "America/Sao_Paulo";
const dayMs = 86_400_000;
const localFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

// Representa os campos locais como UTC apenas para operar o calendário.
function localCalendar(instant: Date): Date {
  const parts = Object.fromEntries(
    localFormatter
      .formatToParts(instant)
      .map(({ type, value }) => [type, value]),
  );
  const calendar = new Date(0);
  calendar.setUTCFullYear(+parts.year, +parts.month - 1, +parts.day);
  calendar.setUTCHours(
    +parts.hour,
    +parts.minute,
    +parts.second,
    instant.getUTCMilliseconds(),
  );
  return calendar;
}

function toInstant(calendar: Date): Date {
  const wall = calendar.getTime();
  // Consulta os offsets dos dois lados de uma possível transição, sem fixar UTC−3.
  const candidates = [-dayMs, 0, dayMs].map((delta) => {
    const sample = new Date(wall + delta);
    const offset = localCalendar(sample).getTime() - sample.getTime();
    return wall - offset;
  });
  const matches = candidates.filter(
    (candidate) => localCalendar(new Date(candidate)).getTime() === wall,
  );
  // Como PostgreSQL: instante posterior na sobreposição; offset anterior no salto.
  return new Date(Math.max(...(matches.length ? matches : candidates)));
}

/** 14 dias seg–sex após a aprovação; não desconta feriados. Precisão: milissegundos. */
export function calculateLoanDueAt(checkedOutAt: Date): Date {
  if (!Number.isFinite(checkedOutAt.getTime())) {
    throw new RangeError("Data de aprovação inválida.");
  }
  const calendar = localCalendar(checkedOutAt);
  let counted = 0;
  while (counted < 14) {
    calendar.setUTCDate(calendar.getUTCDate() + 1);
    if (!Number.isFinite(calendar.getTime())) {
      throw new RangeError("Vencimento fora do intervalo de datas.");
    }
    if (calendar.getUTCDay() !== 0 && calendar.getUTCDay() !== 6) counted++;
  }
  return toInstant(calendar);
}

/** Captura uma única vez o relógio do servidor; permite relógio fixo nos testes. */
export function createLoanPeriod(clock: () => Date = () => new Date()) {
  const checkedOutAt = new Date(clock().getTime());
  return { checkedOutAt, dueAt: calculateLoanDueAt(checkedOutAt) };
}
