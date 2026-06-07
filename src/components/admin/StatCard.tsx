"use client";

import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  hint,
  tone = "brand",
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: "brand" | "green" | "amber" | "rose" | "violet";
  loading?: boolean;
}) {
  const bar = {
    brand: "bg-brand-500",
    green: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    violet: "bg-violet-500",
  }[tone];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-white p-4 shadow-card">
      <span className={cn("absolute inset-x-0 top-0 h-1", bar)} />
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-slate-100" />
      ) : (
        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 sm:text-3xl">
          {value}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
