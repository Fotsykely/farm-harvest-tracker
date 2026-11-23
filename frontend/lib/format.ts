const kgFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 });

// 1234.5 -> "1 234,5 kg". Quantities have at most two decimals (the API stores DECIMAL(10,2)).
export function formatKg(quantity: number): string {
  return `${kgFormatter.format(quantity)} kg`;
}

// The same number without the unit, for table cells whose header already says "(kg)".
export function formatQuantity(quantity: number): string {
  return kgFormatter.format(quantity);
}
