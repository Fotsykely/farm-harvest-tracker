// Shown while a page reads the API: the shapes roughly match a period picker and a few cards,
// so the page does not jump when the content arrives.
export function ListSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement…</span>
      <div aria-hidden className="flex flex-col gap-3">
        <div className="mb-3 h-[4.5rem] w-2/3 rounded-md bg-border" />
        <div className="h-24 rounded-lg bg-border" />
        <div className="h-24 rounded-lg bg-border" />
        <div className="h-24 rounded-lg bg-border" />
      </div>
    </div>
  );
}
