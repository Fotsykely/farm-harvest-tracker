import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/list-skeleton";
import { PeriodPicker } from "@/components/period-picker";
import { getResults } from "@/lib/api-client/results";
import { formatQuantity } from "@/lib/format";
import { parsePeriod, periodLabel } from "@/lib/period";
import { currentDate } from "@/lib/today";

export const metadata: Metadata = { title: "Résultat" };

export default function ResultsPage(props: PageProps<"/results">) {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Résultat</h1>
      <Suspense fallback={<ListSkeleton />}>
        <ResultsContent searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function ResultsContent({ searchParams }: { searchParams: PageProps<"/results">["searchParams"] }) {
  const query = await searchParams;
  const today = await currentDate();
  const period = parsePeriod(query, today);
  // The API does the calculation and the sort: the page only displays the rows in the order received.
  const results = await getResults(period);

  return (
    <>
      <PeriodPicker action="/results" period={period} today={today} />

      <h2 className="mb-1 text-lg font-semibold">{periodLabel(period)}</h2>
      <p className="mb-3 text-sm text-muted-foreground">Quantités en kg, du plus grand total au plus petit.</p>

      {/* Narrow screens: tight cells so the five columns fit; a very large number can still scroll sideways. */}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface shadow-sm">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">
            Récoltes par parcelle en {periodLabel(period).toLowerCase()}, en kg, du plus grand total au plus petit
          </caption>
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="px-2 py-2 sm:px-4 text-left font-semibold">Parcelle</th>
              <th scope="col" className="px-2 py-2 sm:px-4 text-right font-semibold">Riz</th>
              <th scope="col" className="px-2 py-2 sm:px-4 text-right font-semibold">Maïs</th>
              <th scope="col" className="px-2 py-2 sm:px-4 text-right font-semibold">Manioc</th>
              <th scope="col" className="px-2 py-2 sm:px-4 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row) => (
              <tr key={row.plotId} className="border-b border-border last:border-b-0">
                <th scope="row" className="px-2 py-3 sm:px-4 text-left font-semibold">
                  {row.plotName}
                  {/* Text, not colour alone: the zeros of a plot without entry are not a harvest of zero. */}
                  {!row.hasEntry && <span className="block text-xs font-normal text-muted-foreground">Aucune saisie</span>}
                </th>
                <td className="px-2 py-3 sm:px-4 text-right">{formatQuantity(row.riceKg)}</td>
                <td className="px-2 py-3 sm:px-4 text-right">{formatQuantity(row.maizeKg)}</td>
                <td className="px-2 py-3 sm:px-4 text-right">{formatQuantity(row.cassavaKg)}</td>
                <td className="px-2 py-3 sm:px-4 text-right font-semibold">{formatQuantity(row.totalKg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
