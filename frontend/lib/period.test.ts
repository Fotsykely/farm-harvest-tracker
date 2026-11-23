import { describe, expect, it } from "vitest";
import { monthName, parsePeriod, periodLabel, periodQuery, yearOptions } from "./period";

const today = new Date(2026, 10, 23); // 23 November 2026

describe("parsePeriod", () => {
  it("reads the year and the month of the query string", () => {
    expect(parsePeriod({ year: "2025", month: "3" }, today)).toEqual({ year: 2025, month: 3 });
  });

  it("falls back to the current month when nothing is given", () => {
    expect(parsePeriod({}, today)).toEqual({ year: 2026, month: 11 });
  });

  it.each(["abc", "", "13", "0", "3.5", "-2", "03abc"])("ignores the invalid month %j", (month) => {
    expect(parsePeriod({ year: "2025", month }, today)).toEqual({ year: 2025, month: 11 });
  });

  it.each(["1999", "2101", "x"])("ignores the invalid year %j", (year) => {
    expect(parsePeriod({ year, month: "3" }, today)).toEqual({ year: 2026, month: 3 });
  });

  it("ignores a value repeated in the URL (an array)", () => {
    expect(parsePeriod({ year: ["2025", "2024"], month: "3" }, today)).toEqual({ year: 2026, month: 3 });
  });
});

describe("period labels", () => {
  it("names the months in French with a capital letter", () => {
    expect(monthName(1)).toBe("Janvier");
    expect(monthName(12)).toBe("Décembre");
    expect(periodLabel({ year: 2026, month: 2 })).toBe("Février 2026");
  });

  it("builds the query string", () => {
    expect(periodQuery({ year: 2026, month: 3 })).toBe("year=2026&month=3");
  });
});

describe("yearOptions", () => {
  it("offers four years back and next year", () => {
    expect(yearOptions(2026, today)).toEqual([2022, 2023, 2024, 2025, 2026, 2027]);
  });

  it("always includes the selected year, even a far one", () => {
    expect(yearOptions(2010, today)[0]).toBe(2010);
    expect(yearOptions(2040, today).at(-1)).toBe(2040);
  });
});
