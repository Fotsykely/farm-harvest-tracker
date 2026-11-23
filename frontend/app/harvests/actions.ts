"use server";

import { redirect } from "next/navigation";
import { ApiNotFoundError } from "@/lib/api-client/client";
import { createHarvest, deleteHarvest, updateHarvest } from "@/lib/api-client/harvests";
import { readText } from "@/lib/form-data";
import { toFormState } from "@/lib/form-errors";
import type { FormState } from "@/lib/form-state";
import { QUANTITY_FIELDS, readQuantities } from "@/lib/harvest-form";
import { periodQuery, type Period } from "@/lib/period";
import { revalidateAllPages } from "@/lib/revalidate";

// Form field names, used to keep only the API messages that belong to this form.
const UPDATE_FIELDS = QUANTITY_FIELDS;
const CREATE_FIELDS = [...QUANTITY_FIELDS, "plotId", "year", "month"] as const;

// These actions stay thin: read the form, call the API client, then redirect or return the errors.
// redirect() works by throwing, so it is always called outside the try/catch blocks.
// After a change the user lands on the list of entries of the month that was changed.

export async function createHarvestAction(_previousState: FormState, formData: FormData): Promise<FormState> {
  const { quantities, values, errors } = readQuantities(formData);
  if (Object.keys(errors).length > 0) return { status: "error", message: null, fieldErrors: errors, values };

  const period = { year: Number(readText(formData, "year")), month: Number(readText(formData, "month")) };

  try {
    await createHarvest({ plotId: Number(readText(formData, "plotId")), ...period, ...quantities });
  } catch (error) {
    return toFormState(error, CREATE_FIELDS, values);
  }

  revalidateAllPages();
  redirect(`/harvests?${periodQuery(period)}`);
}

// Bound to the entry id by the edit page: updateHarvestAction.bind(null, harvest.id).
export async function updateHarvestAction(
  harvestId: number,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { quantities, values, errors } = readQuantities(formData);
  if (Object.keys(errors).length > 0) return { status: "error", message: null, fieldErrors: errors, values };

  let period: Period;
  try {
    // The month comes back from the API: the plot and the month of an entry never change.
    const { year, month } = await updateHarvest(harvestId, quantities);
    period = { year, month };
  } catch (error) {
    return toFormState(error, UPDATE_FIELDS, values);
  }

  revalidateAllPages();
  redirect(`/harvests?${periodQuery(period)}`);
}

// Bound to the entry id and its month by the list: deleteHarvestAction.bind(null, harvest.id, period).
export async function deleteHarvestAction(harvestId: number, period: Period): Promise<void> {
  try {
    await deleteHarvest(harvestId);
  } catch (error) {
    // Already deleted (for example in another tab): the goal is reached, so carry on.
    if (!(error instanceof ApiNotFoundError)) throw error;
  }

  revalidateAllPages();
  redirect(`/harvests?${periodQuery(period)}`);
}
