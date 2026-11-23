import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { HarvestForm } from "@/components/harvest-form";
import { listPlots } from "@/lib/api-client/plots";
import { parsePeriod, periodLabel, periodQuery } from "@/lib/period";
import { createHarvestAction } from "../actions";

export const metadata: Metadata = { title: "Nouvelle saisie" };

// The plot and the month come from the URL: /harvests/new?plotId=3&year=2026&month=3
export default function NewHarvestPage(props: PageProps<"/harvests/new">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Nouvelle saisie</h1>
      <Suspense fallback={<HarvestFormSkeleton />}>
        <NewHarvestForm searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function NewHarvestForm({ searchParams }: { searchParams: PageProps<"/harvests/new">["searchParams"] }) {
  const query = await searchParams;
  const period = parsePeriod(query, new Date());
  const plots = await listPlots();
  const plot = plots.find((candidate) => String(candidate.id) === query.plotId);
  if (!plot) notFound();

  return (
    <>
      <p className="mb-6 text-lg">
        <span className="font-semibold">{plot.name}</span> · {periodLabel(period)}
      </p>
      <HarvestForm
        action={createHarvestAction}
        initialValues={{ riceKg: "", maizeKg: "", cassavaKg: "" }}
        hiddenFields={{ plotId: String(plot.id), year: String(period.year), month: String(period.month) }}
        cancelHref={`/?${periodQuery(period)}`}
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
