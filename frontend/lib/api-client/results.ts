import { apiFetch } from "./client";
import type { PlotResult } from "./types";

// GET /api/results: the six plots with their quantities of the month, already sorted by the API
// (biggest total first, plots without entry last with zeros). The front only displays the rows.
export function getResults(period: { year: number; month: number }): Promise<PlotResult[]> {
  return apiFetch(`/api/results?year=${period.year}&month=${period.month}`);
}
