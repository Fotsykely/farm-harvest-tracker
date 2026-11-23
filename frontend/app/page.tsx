import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/list-skeleton";
import { PeriodPicker } from "@/components/period-picker";
import { listHarvests } from "@/lib/api-client/harvests";
import { listPlots } from "@/lib/api-client/plots";
import { parsePeriod, periodLabel } from "@/lib/period";
import { PlotRow } from "./_components/plot-row";

export const metadata: Metadata = { title: "Parcelles" };

// The heading renders instantly; reading `searchParams` and calling the API happen in a child inside
// its own <Suspense> (see the README: with Cache Components, uncached data must sit under a boundary).
export default function PlotsPage(props: PageProps<"/">) {
  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Parcelles</h1>
      <p className="mb-6 text-muted-foreground">
        Choisissez le mois et l&apos;année, puis la parcelle dont vous voulez saisir les récoltes.
      </p>
      <Suspense fallback={<ListSkeleton />}>
        <PlotsContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function PlotsContent({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const query = await searchParams;
  // The current date is read after the request data (searchParams): before it, Next refuses `new Date()`
  // because the value would be frozen in the prerendered page.
  const today = new Date();
  const period = parsePeriod(query, today);
  const [plots, harvests] = await Promise.all([listPlots(), listHarvests(period)]);
  const harvestByPlot = new Map(harvests.map((harvest) => [harvest.plotId, harvest]));

  return (
    <>
      <PeriodPicker action="/" period={period} today={today} />
      <h2 className="mb-3 text-lg font-semibold">{periodLabel(period)}</h2>
      <ul className="grid gap-3">
        {plots.map((plot) => (
          <li key={plot.id}>
            <PlotRow plot={plot} harvest={harvestByPlot.get(plot.id)} period={period} />
          </li>
        ))}
      </ul>
    </>
  );
}
