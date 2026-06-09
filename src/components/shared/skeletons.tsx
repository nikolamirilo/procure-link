// Lightweight skeletons used by route-level loading.tsx files. Pure markup,
// no text, so they need no translation.

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted/70" />
      </div>
      <div className="rounded-xl border divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/4 rounded bg-muted/70" />
            </div>
            <div className="h-6 w-20 rounded-full bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardGridSkeleton({ cards = 8 }: { cards?: number }) {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-48 rounded-md bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <div className="h-28 w-full rounded-lg bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-1/3 rounded bg-muted/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
