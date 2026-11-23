import { Pencil } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { ConfirmDelete } from "@/components/confirm-delete";
import type { Harvest } from "@/lib/api-client/types";
import { formatKg } from "@/lib/format";
import { periodLabel } from "@/lib/period";
import { deleteHarvestAction } from "../harvests/actions";

// An entry of the list, with its edit and delete buttons.
export function HarvestRow({ harvest }: { harvest: Harvest }) {
  const period = { year: harvest.year, month: harvest.month };
  const label = `${harvest.plotName}, ${periodLabel(period).toLowerCase()}`;

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="min-w-0">
        <h2 className="break-words font-semibold">{harvest.plotName}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <Quantity label="Riz" value={formatKg(harvest.riceKg)} />
          <Quantity label="Maïs" value={formatKg(harvest.maizeKg)} />
          <Quantity label="Manioc" value={formatKg(harvest.cassavaKg)} />
          <Quantity label="Total" value={formatKg(harvest.totalKg)} strong />
        </dl>
      </div>

      <div className="flex shrink-0 gap-2">
        <ButtonLink href={`/harvests/${harvest.id}/edit`} variant="secondary" aria-label={`Modifier la saisie ${label}`}>
          <Pencil aria-hidden className="size-4" />
        </ButtonLink>
        <ConfirmDelete
          iconOnly
          triggerLabel={`Supprimer la saisie ${label}`}
          title="Supprimer cette saisie ?"
          description={`La saisie de « ${harvest.plotName} » pour ${periodLabel(period).toLowerCase()} sera supprimée définitivement.`}
          confirmLabel="Supprimer"
          action={deleteHarvestAction.bind(null, harvest.id, period)}
        />
      </div>
    </div>
  );
}

function Quantity({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={strong ? "font-semibold" : undefined}>{value}</dd>
    </div>
  );
}
