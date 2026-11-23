import { readDecimal, readText } from "./form-data";
import type { FieldErrors, HarvestQuantities } from "./api-client/types";
import type { FormValues } from "./form-state";

// Names of the three quantity fields: the form fields and the JSON properties of the API are the same.
export const QUANTITY_FIELDS = ["riceKg", "maizeKg", "cassavaKg"] as const;

const NOT_A_NUMBER_MESSAGE = "Saisissez un nombre, par exemple 120,5.";

type ReadQuantities = {
  quantities: HarvestQuantities;
  // What was typed, to refill the form after an error.
  values: FormValues;
  // Only the fields that are not numbers: range and "required" messages come from the API.
  errors: FieldErrors;
};

// Reads the three quantities of the entry form. A text that is not a number cannot be sent as JSON,
// so this one case is reported here; every other rule (required, 0 to 9 999 999,99) stays in the API.
export function readQuantities(formData: FormData): ReadQuantities {
  const quantities: HarvestQuantities = { riceKg: null, maizeKg: null, cassavaKg: null };
  const values: FormValues = {};
  const errors: FieldErrors = {};

  for (const field of QUANTITY_FIELDS) {
    values[field] = readText(formData, field);
    const quantity = readDecimal(formData, field);
    if (Number.isNaN(quantity)) errors[field] = [NOT_A_NUMBER_MESSAGE];
    else quantities[field] = quantity;
  }

  return { quantities, values, errors };
}

// 120.5 -> "120,5": the text shown in a field when an existing entry is edited.
export function quantityToInput(quantity: number): string {
  return String(quantity).replace(".", ",");
}
