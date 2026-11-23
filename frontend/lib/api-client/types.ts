// These types mirror the DTOs of the ASP.NET Core API (backend/Api/Dtos).
// When a DTO changes, update the matching type here.

export interface Plot {
  id: number;
  name: string;
}

// One monthly entry: the quantities (kg) harvested on one plot during one month.
export interface Harvest {
  id: number;
  plotId: number;
  plotName: string;
  year: number;
  month: number; // 1 to 12
  riceKg: number;
  maizeKg: number;
  cassavaKg: number;
  totalKg: number; // computed by the API
  createdAt: string; // ISO 8601 date and time
}

// The three quantities, the only part of an entry that can change.
// null = field left empty: the API answers with a "required" message.
export type HarvestQuantities = {
  riceKg: number | null;
  maizeKg: number | null;
  cassavaKg: number | null;
};

// Request body to create an entry: the plot and the month, plus the quantities.
export type CreateHarvestInput = HarvestQuantities & {
  plotId: number;
  year: number;
  month: number;
};

// One row of the result of a month. A plot without entry has zeros and hasEntry = false.
export interface PlotResult {
  plotId: number;
  plotName: string;
  riceKg: number;
  maizeKg: number;
  cassavaKg: number;
  totalKg: number;
  hasEntry: boolean;
}

// Validation messages per form field, with camelCase field names: { riceKg: ["La quantité de riz est obligatoire."] }
export type FieldErrors = Record<string, string[]>;
