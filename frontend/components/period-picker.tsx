import Form from "next/form";
import { Button } from "@/components/button";
import { SelectField } from "@/components/field";
import { monthName, yearOptions, type Period } from "@/lib/period";

type PeriodPickerProps = {
  // Page the form reloads (GET): the choice travels in the URL, so it can be bookmarked and shared.
  action: string;
  period: Period;
  today: Date;
};

// Month and year selectors, shared by the plots, entries and result pages.
export function PeriodPicker({ action, period, today }: PeriodPickerProps) {
  return (
    <Form action={action} aria-label="Choix du mois et de l'année" className="mb-6 flex flex-wrap items-end gap-3">
      <div className="w-44">
        <SelectField label="Mois" name="month" defaultValue={period.month}>
          {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
            <option key={month} value={month}>
              {monthName(month)}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="w-32">
        <SelectField label="Année" name="year" defaultValue={period.year}>
          {yearOptions(period.year, today).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </SelectField>
      </div>
      <Button type="submit" variant="secondary">
        Afficher
      </Button>
    </Form>
  );
}
