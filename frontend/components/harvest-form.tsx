"use client";

import { useActionState } from "react";
import { ButtonLink } from "@/components/button";
import { FormError, InputField } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/form-state";

type HarvestFormProps = {
  action: (previousState: FormState, formData: FormData) => Promise<FormState>;
  // Text of the three fields when the form first shows (empty for a new entry).
  initialValues: { riceKg: string; maizeKg: string; cassavaKg: string };
  // Fixed fields of a new entry (plot, year, month): they are not editable, so they travel hidden.
  hiddenFields?: Record<string, string>;
  cancelHref: string;
};

// The three quantities of an entry, shared by the "new" and "edit" pages. The API validates; this form only
// displays the messages it sends back under the matching field (noValidate turns the browser's own checks off).
export function HarvestForm({ action, initialValues, hiddenFields = {}, cancelHref }: HarvestFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_FORM_STATE);

  const values = state.status === "error" ? state.values : initialValues;
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  // Errors on the hidden fields have no field to sit under: they are shown at the top of the form.
  const hiddenFieldErrors = Object.keys(hiddenFields).flatMap((name) => fieldErrors[name] ?? []);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {Object.entries(hiddenFields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      {state.status === "error" && state.message && <FormError>{state.message}</FormError>}
      {hiddenFieldErrors.map((message) => (
        <FormError key={message}>{message}</FormError>
      ))}

      <InputField
        label="Riz (kg)"
        name="riceKg"
        inputMode="decimal"
        autoComplete="off"
        defaultValue={values.riceKg}
        errors={fieldErrors.riceKg}
      />
      <InputField
        label="Maïs (kg)"
        name="maizeKg"
        inputMode="decimal"
        autoComplete="off"
        defaultValue={values.maizeKg}
        errors={fieldErrors.maizeKg}
      />
      <InputField
        label="Manioc (kg)"
        name="cassavaKg"
        inputMode="decimal"
        autoComplete="off"
        hint="Saisissez 0 si rien n'a été récolté."
        defaultValue={values.cassavaKg}
        errors={fieldErrors.cassavaKg}
      />

      <div className="flex flex-wrap gap-3">
        <SubmitButton>Enregistrer</SubmitButton>
        <ButtonLink href={cancelHref} variant="secondary">
          Annuler
        </ButtonLink>
      </div>
    </form>
  );
}
