export function parseDateInput(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatDateInTimeZone(
  date: Date,
  timeZone = 'Asia/Shanghai',
): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

export function getYearMonthFromDate(date: Date): { year: number; month: number } {
  const iso = formatDate(date);
  const [year, month] = iso.split('-').map((value) => Number(value));
  return { year, month };
}
