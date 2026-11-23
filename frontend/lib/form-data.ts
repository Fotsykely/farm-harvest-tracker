// FormData values are a string or a File; our forms only have text fields.
export function readText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

// Reads a quantity typed by a French user: "12,5" and "12.5" are both accepted, spaces are ignored.
// Returns null when the field is empty (the API says it is required) and NaN when it is not a number.
export function readDecimal(formData: FormData, field: string): number | null {
  const text = readText(formData, field).replace(/\s/g, "").replace(",", ".");
  if (text === "") return null;
  return /^-?\d+(\.\d+)?$/.test(text) ? Number(text) : Number.NaN;
}
