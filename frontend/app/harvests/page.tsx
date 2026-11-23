import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/list-skeleton";
import { PeriodPicker } from "@/components/period-picker";
import { listHarvests } from "@/lib/api-client/harvests";
import { parsePeriod, periodLabel } from "@/lib/period";
import { HarvestRow } from "../_components/harvest-row";

export const metadata: Metadata = { title: "Saisies" };

export default function HarvestsPage(props: PageProps<"/harvests">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Saisies</h1>
      <Suspense fallback={<ListSkeleton />}>
        <HarvestsContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function HarvestsContent({ searchParams }: { searchParams: PageProps<"/harvests">["searchParams"] }) {
  const query = await searchParams;
  const today = new Date(); // after the request data, see app/page.tsx
  const period = parsePeriod(query, today);
  const harvests = await listHarvests(period);

  return (
    <>
      <PeriodPicker action="/harvests" period={period} today={today} />
      <h2 className="mb-3 text-lg font-semibold">{periodLabel(period)}</h2>

      {harvests.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-input p-6 text-center text-muted-foreground">
          Aucune saisie pour cette période. Ajoutez-en depuis la liste des{" "}
          <Link href="/" className="font-semibold text-primary underline">
            parcelles
          </Link>
          .
        </p>
      ) : (
        <ul className="grid gap-3">
          {harvests.map((harvest) => (
            <li key={harvest.id}>
              <HarvestRow harvest={harvest} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
