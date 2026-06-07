"use client";

import { useState } from "react";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Badge, Pagination, relativeTime } from "@/components/admin/ui";
import { useAdminAudit, useAdminHealth } from "@/hooks/adminQueries";
import { cn } from "@/lib/cn";
import type { AuditEntry } from "@/types";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86_400);
  const h = Math.floor((seconds % 86_400) / 3_600);
  const m = Math.floor((seconds % 3_600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function HealthTile({
  label,
  value,
  ok,
}: {
  label: string;
  value: React.ReactNode;
  ok?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        {ok !== undefined && (
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              ok ? "bg-emerald-500" : "bg-rose-500",
            )}
          />
        )}
      </div>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function auditTone(action: string) {
  if (action.includes("ban") || action.includes("delete")) return "rose";
  if (action.includes("suspend") || action.includes("hide")) return "amber";
  if (action.includes("role")) return "violet";
  return "slate";
}

export default function AdminHealthPage() {
  const { data: health, isPending: healthPending } = useAdminHealth();
  const [page, setPage] = useState(1);
  const { data: audit, isPending: auditPending, isFetching } = useAdminAudit(page);

  const columns: Column<AuditEntry>[] = [
    {
      key: "action",
      header: "Action",
      render: (e) => (
        <Badge tone={auditTone(e.action)} className="font-mono lowercase">
          {e.action}
        </Badge>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      render: (e) => <span className="text-slate-700">{e.actor.name}</span>,
    },
    {
      key: "target",
      header: "Target",
      render: (e) => {
        const label =
          e.targetLabel ?? e.metadata?.name ?? `${e.targetType}:${e.targetId}`;
        // `name` is already shown as the label — keep only the other details.
        const extra = e.metadata
          ? Object.entries(e.metadata).filter(([k]) => k !== "name")
          : [];
        return (
          <span className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">{label}</span>
            <span className="ml-1 text-slate-400">· {e.targetType}</span>
            {extra.length > 0 && (
              <span className="ml-1 text-slate-400">
                ({extra.map(([k, v]) => `${k}=${v}`).join(", ")})
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "when",
      header: "When",
      render: (e) => (
        <span className="text-xs text-slate-400">{relativeTime(e.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-500">System health</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <HealthTile
            label="API"
            value={health ? (health.apiOk ? "Operational" : "Down") : "—"}
            ok={health?.apiOk}
          />
          <HealthTile
            label="Database"
            value={health ? (health.dbOk ? "Connected" : "Error") : "—"}
            ok={health?.dbOk}
          />
          <HealthTile
            label="Socket connections"
            value={healthPending ? "—" : health?.socketConnections ?? 0}
          />
          <HealthTile
            label="Uptime"
            value={healthPending ? "—" : formatUptime(health?.uptimeSeconds ?? 0)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-500">Audit log</h2>
          <span className="text-xs text-slate-400">
            Every privileged action is recorded
          </span>
        </div>
        <AdminTable
          columns={columns}
          rows={audit?.entries}
          rowKey={(e) => e.id}
          loading={auditPending}
          refreshing={isFetching && !auditPending}
          emptyLabel="No admin actions recorded yet — try suspending a user or hiding a post."
        />
        {audit && (
          <Pagination
            page={audit.pagination.page}
            totalPages={audit.pagination.totalPages}
            total={audit.pagination.total}
            onPage={setPage}
            busy={isFetching}
          />
        )}
      </section>
    </div>
  );
}
