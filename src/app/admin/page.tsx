"use client";

import { StatCard } from "@/components/admin/StatCard";
import { MiniAreaChart } from "@/components/admin/MiniAreaChart";
import { AdminOverviewSkeleton } from "@/components/admin/AdminSkeletons";
import { useAdminStats } from "@/hooks/adminQueries";

const nf = new Intl.NumberFormat();

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

export default function AdminOverviewPage() {
  const { data, isPending } = useAdminStats();
  const s = data;

  // First load (no cached data yet) → show a skeleton that matches the layout.
  if (isPending) return <AdminOverviewSkeleton />;

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">People</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Total users"
            value={s ? nf.format(s.users.total) : "—"}
            hint={s ? `+${s.users.newToday} today` : undefined}
            loading={isPending}
          />
          <StatCard
            label="Online now"
            value={s ? nf.format(s.users.onlineNow) : "—"}
            tone="green"
            hint={s ? `${s.users.newThisWeek} new this week` : undefined}
            loading={isPending}
          />
          <StatCard
            label="Suspended"
            value={s ? nf.format(s.users.suspended) : "—"}
            tone="amber"
            loading={isPending}
          />
          <StatCard
            label="Banned"
            value={s ? nf.format(s.users.banned) : "—"}
            tone="rose"
            loading={isPending}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">
          Activity today
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Posts today"
            value={s ? nf.format(s.content.postsToday) : "—"}
            hint={s ? `${nf.format(s.content.postsTotal)} all time` : undefined}
            loading={isPending}
          />
          <StatCard
            label="Comments today"
            value={s ? nf.format(s.content.commentsToday) : "—"}
            loading={isPending}
          />
          <StatCard
            label="Messages today"
            value={s ? nf.format(s.messaging.messagesToday) : "—"}
            tone="violet"
            hint="metadata only — no content"
            loading={isPending}
          />
          <StatCard
            label="Open reports"
            value={s ? nf.format(s.reports.open) : "—"}
            tone={s && s.reports.open > 0 ? "rose" : "green"}
            hint={s ? `${s.reports.resolvedToday} resolved today` : undefined}
            loading={isPending}
          />
        </div>
      </section>

      <section className="grid gap-3 sm:gap-4 lg:grid-cols-2">
        <ChartCard title="New signups" subtitle="Last 14 days">
          {s ? (
            <MiniAreaChart data={s.series.signups} stroke="#10b981" fill="rgba(16,185,129,0.18)" />
          ) : (
            <div className="h-[88px] animate-pulse rounded-lg bg-slate-100" />
          )}
        </ChartCard>
        <ChartCard title="Messages sent" subtitle="Last 14 days">
          {s ? (
            <MiniAreaChart data={s.series.messages} stroke="#3b82f6" fill="rgba(59,130,246,0.18)" />
          ) : (
            <div className="h-[88px] animate-pulse rounded-lg bg-slate-100" />
          )}
        </ChartCard>
      </section>

      <p className="px-1 text-xs text-slate-400">
        Privacy-safe by design: this dashboard surfaces aggregate counts and
        public content only. Private message contents are never exposed.
      </p>
    </div>
  );
}
