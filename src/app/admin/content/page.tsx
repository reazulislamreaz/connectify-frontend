"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import { Badge, Pagination, SearchInput, relativeTime } from "@/components/admin/ui";
import {
  useAdminPosts,
  useDeletePost,
  useUpdatePost,
} from "@/hooks/adminQueries";
import type { AdminPostsFilter } from "@/lib/adminKeys";
import { toastConfirm } from "@/lib/toastConfirm";
import { toastError, toastSuccess } from "@/lib/toast";
import type { AdminPostRow } from "@/types";

export default function AdminContentPage() {
  const [search, setSearch] = useState("");
  const [reportedOnly, setReportedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const filter = useMemo<AdminPostsFilter>(
    () => ({ search, reportedOnly, page }),
    [search, reportedOnly, page],
  );
  const { data, isPending, isFetching } = useAdminPosts(filter);
  const updatePost = useUpdatePost();
  const deletePost = useDeletePost();

  const toggleHidden = async (p: AdminPostRow) => {
    try {
      await updatePost.mutateAsync({ id: p.id, hidden: !p.hidden });
      toastSuccess(p.hidden ? "Post is visible again" : "Post hidden from feed");
    } catch {
      toastError("Action failed");
    }
  };

  const remove = async (p: AdminPostRow) => {
    const ok = await toastConfirm({
      message: "Permanently delete this post? This cannot be undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deletePost.mutateAsync(p.id);
      toastSuccess("Post deleted");
    } catch {
      toastError("Delete failed");
    }
  };

  const columns: Column<AdminPostRow>[] = [
    {
      key: "post",
      header: "Post",
      render: (p) => (
        <div className="flex items-start gap-3">
          <Avatar name={p.author.name} src={p.author.profilePicture} size="sm" />
          <div className="min-w-0 max-w-md">
            <p className="truncate text-xs font-medium text-slate-500">
              {p.author.name}
            </p>
            <p className="line-clamp-2 text-slate-800">{p.content}</p>
            {p.hidden && (
              <Badge tone="amber" className="mt-1">
                Hidden
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "engagement",
      header: "Engagement",
      className: "tabular-nums",
      render: (p) => (
        <span className="text-xs text-slate-500">
          {p.likesCount} likes · {p.commentsCount} comments
        </span>
      ),
    },
    {
      key: "reports",
      header: "Reports",
      className: "tabular-nums",
      render: (p) =>
        p.reportsCount > 0 ? (
          <Badge tone="rose">{p.reportsCount}</Badge>
        ) : (
          <span className="text-slate-300">0</span>
        ),
    },
    {
      key: "created",
      header: "Posted",
      render: (p) => (
        <span className="text-xs text-slate-400">{relativeTime(p.createdAt)}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (p) => (
        <div className="flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => toggleHidden(p)}
            disabled={updatePost.isPending}
            className="btn-secondary !px-2.5 !py-1 text-xs"
          >
            {p.hidden ? "Unhide" : "Hide"}
          </button>
          <button
            type="button"
            onClick={() => remove(p)}
            disabled={deletePost.isPending}
            className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search post text or author"
        />
        <label className="inline-flex cursor-pointer select-none items-center gap-2 rounded-xl border border-surface-border bg-white px-3 py-2.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={reportedOnly}
            onChange={(e) => {
              setReportedOnly(e.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Reported only
        </label>
      </div>

      <AdminTable
        columns={columns}
        rows={data?.posts}
        rowKey={(p) => p.id}
        loading={isPending}
        refreshing={isFetching && !isPending}
        emptyLabel="No posts match these filters"
      />

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
