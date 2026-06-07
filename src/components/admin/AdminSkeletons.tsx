import { Skeleton } from "@/components/skeletons/Skeleton";

/** A stat card placeholder shaped exactly like <StatCard />. */
function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-white p-4 shadow-card">
      <span className="absolute inset-x-0 top-0 h-1 bg-slate-200" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-2 h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}

function StatGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** A chart card placeholder shaped like the New signups / Messages cards. */
function ChartCardSkeleton() {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-[88px] w-full" />
    </div>
  );
}

/** Full Overview skeleton — mirrors the People + Activity grids and the charts. */
export function AdminOverviewSkeleton() {
  return (
    <div className="space-y-5">
      <section>
        <Skeleton className="mb-3 h-4 w-16" />
        <StatGridSkeleton />
      </section>
      <section>
        <Skeleton className="mb-3 h-4 w-28" />
        <StatGridSkeleton />
      </section>
      <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </section>
    </div>
  );
}
