// The month and the year chosen on the pages (plots, entries, result), carried in the URL:
// /harvests?year=2026&month=3. They have the same bounds as the API (Harvest.MinYear / MaxYear).

export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

export type Period = { year: number; month: number };

type SearchParams = Record<string, string | string[] | undefined>;

// Reads year and month from the query string. A missing or invalid value falls back to the current
// month, so a hand-edited URL never breaks the page. `today` is passed in to keep the function testable.
export function parsePeriod(searchParams: SearchParams, today: Date): Period {
  return {
    year: readInteger(searchParams.year, MIN_YEAR, MAX_YEAR) ?? today.getFullYear(),
    month: readInteger(searchParams.month, 1, 12) ?? today.getMonth() + 1,
  };
}

export function periodQuery({ year, month }: Period): string {
  return `year=${year}&month=${month}`;
}

// 1 = "Janvier", 12 = "Décembre".
export function monthName(month: number): string {
  const name = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(new Date(2000, month - 1, 1));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// "Mars 2026"
export function periodLabel({ year, month }: Period): string {
  return `${monthName(month)} ${year}`;
}

// Years offered in the selector: a few years back, next year, and always the selected one.
export function yearOptions(selectedYear: number, today: Date): number[] {
  const first = Math.min(today.getFullYear() - 4, selectedYear);
  const last = Math.max(today.getFullYear() + 1, selectedYear);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

// Only a plain integer in the range counts: "3", not "3.5", "03abc" or "".
function readInteger(value: string | string[] | undefined, min: number, max: number): number | undefined {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return number >= min && number <= max ? number : undefined;
}
