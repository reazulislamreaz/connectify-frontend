"use client";

import { useMemo, useState } from "react";
import { Badge, Pagination, relativeTime } from "@/components/admin/ui";
import { useAdminReports, useResolveReport } from "@/hooks/adminQueries";
import type { AdminReportsFilter } from "@/lib/adminKeys";
import { toastError, toastSuccess } from "@/lib/toast";
import { cn } from "@/lib/cn";
import type { Report, ReportStatus, ReportTargetType } from "@/types";

const STATUS_TABS: (ReportStatus | "all")[] = [
  "open",
  "resolved",
  "dismissed",
  "all",
];

const TARGET_TONE: Record<
  ReportTargetType,
  "brand" | "violet" | "amber" | "slate"
> = {
  post: "brand",
  comment: "violet",
  user: "amber",
  message: "slate",
};

function ReportCard({ report }: { report: Report }) {
  const resolve = useResolveReport();
  const isOpen = report.status === "open";

  const act = async (
    status: Extract<ReportStatus, "resolved" | "dismissed">,
    action?: string,
  ) => {
    try {
      await resolve.mutateAsync({ id: report.id, status, action });
      toastSuccess(
        status === "resolved" ? "Report resolved" : "Report dismissed",
      );
    } catch {
      toastError("Action failed");
    }
  };

  return (
    <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TARGET_TONE[report.targetType]} className="capitalize">
          {report.targetType}
        </Badge>
        <span className="text-sm font-semibold text-slate-800">
          {report.reason}
        </span>
        <span className="ml-auto text-xs text-slate-400">
          {relativeTime(report.createdAt)}
        </span>
      </div>

      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {report.targetPreview}
      </p>
      {report.note && (
        <p className="mt-2 text-xs italic text-slate-500">“{report.note}”</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-400">
          Reported by{" "}
          <span className="font-medium text-slate-600">
            {report.reporter.name}
          </span>
        </span>
        {isOpen ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => act("dismissed")}
              disabled={resolve.isPending}
              className="btn-secondary !px-3 !py-1.5 text-xs"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => act("resolved", "content_removed")}
              disabled={resolve.isPending}
              className="btn-primary !px-3 !py-1.5 text-xs"
            >
              Resolve
            </button>
          </div>
        ) : (
          <Badge
            tone={report.status === "resolved" ? "green" : "slate"}
            className="capitalize"
          >
            {report.status}
          </Badge>
        )}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const [status, setStatus] = useState<AdminReportsFilter["status"]>("open");
  const [page, setPage] = useState(1);

  const filter = useMemo<AdminReportsFilter>(
    () => ({ status, page }),
    [status, page],
  );
  const { data, isPending, isFetching } = useAdminReports(filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-surface-border bg-white p-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition",
              status === s
                ? "bg-brand-500 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-surface-border bg-white"
            />
          ))}
        </div>
      ) : data && data.reports.length > 0 ? (
        <div
          className={cn(
            "grid gap-3 transition-opacity sm:grid-cols-2",
            isFetching && "opacity-60",
          )}
        >
          {data.reports.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-surface-border bg-white py-16 text-center text-sm text-slate-400">
          No {status === "all" ? "" : status} reports
        </div>
      )}

      {data && (
        <Pagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          total={data.pagination.total}
          onPage={setPage}
          busy={isFetching}
        />
      )}
    </div>
  );
}
