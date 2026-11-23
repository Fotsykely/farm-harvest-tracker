import type { Metadata } from "next";
import { Suspense } from "react";
import { HarvestForm } from "@/components/harvest-form";
import { getHarvest } from "@/lib/api-client/harvests";
import { quantityToInput } from "@/lib/harvest-form";
import { periodLabel, periodQuery } from "@/lib/period";
import { orNotFound, parseRouteId } from "@/lib/route-helpers";
import { updateHarvestAction } from "../../actions";

export const metadata: Metadata = { title: "Modifier la saisie" };

type EditHarvestPageProps = PageProps<"/harvests/[harvestId]/edit">;

// The page itself renders instantly (static heading). Reading `params` and calling the API happen in a
// child inside its own <Suspense>: with Cache Components, a boundary above the shared layout (the root
// loading.tsx) does not give an instant fallback on a client navigation to this route.
export default function EditHarvestPage(props: EditHarvestPageProps) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Modifier la saisie</h1>
      <Suspense fallback={<HarvestFormSkeleton />}>
        <EditHarvestForm params={props.params} />
      </Suspense>
    </>
  );
}

async function EditHarvestForm({ params }: { params: EditHarvestPageProps["params"] }) {
  const { harvestId } = await params;
  const harvest = await orNotFound(getHarvest(parseRouteId(harvestId)));
  const period = { year: harvest.year, month: harvest.month };

  return (
    <>
      {/* The plot and the month of an entry never change: only the quantities are editable. */}
      <p className="mb-6 text-lg">
        <span className="font-semibold">{harvest.plotName}</span> · {periodLabel(period)}
      </p>
      <HarvestForm
        action={updateHarvestAction.bind(null, harvest.id)}
        initialValues={{
          riceKg: quantityToInput(harvest.riceKg),
          maizeKg: quantityToInput(harvest.maizeKg),
          cassavaKg: quantityToInput(harvest.cassavaKg),
        }}
        cancelHref={`/harvests?${periodQuery(period)}`}
      />
    </>
  );
}

// Same rough shape as the form (three fields and the buttons), so the page does not jump.
function HarvestFormSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden className="flex flex-col gap-5">
        <div className="h-7 w-1/2 rounded-md bg-border" />
        <div className="h-16 rounded-md bg-border" />
        <div className="h-16 rounded-md bg-border" />
        <div className="h-16 rounded-md bg-border" />
        <div className="h-11 w-40 rounded-md bg-border" />
      </div>
    </div>
  );
}
