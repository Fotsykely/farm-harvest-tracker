import { apiFetch } from "./client";
import type { Plot } from "./types";

// One small function per endpoint of PlotsController. The six plots are fixed: read-only.

export function listPlots(): Promise<Plot[]> {
  return apiFetch("/api/plots");
}
