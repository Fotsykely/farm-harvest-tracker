import { ButtonLink } from "@/components/button";
import type { Harvest, Plot } from "@/lib/api-client/types";
import { formatKg } from "@/lib/format";
import { periodLabel, periodQuery, type Period } from "@/lib/period";

// A plot of the home page, with the way in to its entry of the chosen month:
// "Saisir" when the month is still empty, "Modifier" when an entry already exists (only one per month).
export function PlotRow({ plot, harvest, period }: { plot: Plot; harvest: Harvest | undefined; period: Period }) {
  const when = periodLabel(period).toLowerCase();

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="min-w-0">
        <h2 className="break-words font-semibold">{plot.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {harvest ? `Saisie faite : ${formatKg(harvest.totalKg)} au total` : "Pas encore de saisie pour cette période"}
        </p>
      </div>

      {harvest ? (
        <ButtonLink
          href={`/harvests/${harvest.id}/edit`}
          variant="secondary"
          aria-label={`Modifier la saisie de ${plot.name}, ${when}`}
        >
          Modifier
        </ButtonLink>
      ) : (
        <ButtonLink
          href={`/harvests/new?plotId=${plot.id}&${periodQuery(period)}`}
          aria-label={`Saisir ${plot.name}, ${when}`}
        >
          Saisir
        </ButtonLink>
      )}
    </div>
  );
}
