import { apiFetch, apiFetchNoContent, jsonRequest } from "./client";
import type { CreateHarvestInput, Harvest, HarvestQuantities } from "./types";

// One small function per endpoint of HarvestsController. Pages and Server Actions call these
// and never deal with fetch or status codes.

export function listHarvests(period: { year: number; month: number }): Promise<Harvest[]> {
  return apiFetch(`/api/harvests?year=${period.year}&month=${period.month}`);
}

export function getHarvest(id: number): Promise<Harvest> {
  return apiFetch(`/api/harvests/${id}`);
}

// Answers 409 (ApiConflictError) when the plot already has an entry for this month.
export function createHarvest(input: CreateHarvestInput): Promise<Harvest> {
  return apiFetch("/api/harvests", jsonRequest("POST", input));
}

export function updateHarvest(id: number, quantities: HarvestQuantities): Promise<Harvest> {
  return apiFetch(`/api/harvests/${id}`, jsonRequest("PUT", quantities));
}

export function deleteHarvest(id: number): Promise<void> {
  return apiFetchNoContent(`/api/harvests/${id}`, { method: "DELETE" });
}
