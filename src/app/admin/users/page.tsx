"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { AdminTable, type Column } from "@/components/admin/AdminTable";
import {
  Badge,
  Pagination,
  SearchInput,
  relativeTime,
  roleTone,
  statusTone,
} from "@/components/admin/ui";
import {
  useAdminUsers,
  useForceLogout,
  useUpdateUser,
} from "@/hooks/adminQueries";
import type { AdminUsersFilter } from "@/lib/adminKeys";
import { toastConfirm } from "@/lib/toastConfirm";
import { toastError, toastSuccess } from "@/lib/toast";
import type { AccountStatus, AdminRole, AdminUserRow } from "@/types";

const STATUS_OPTS: (AccountStatus | "all")[] = [
  "all",
  "active",
  "suspended",
  "banned",
];
const ROLE_OPTS: (AdminRole | "all")[] = ["all", "user", "moderator", "admin"];

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminUsersFilter["status"]>("all");
  const [role, setRole] = useState<AdminUsersFilter["role"]>("all");
  const [page, setPage] = useState(1);

  const filter = useMemo<AdminUsersFilter>(
    () => ({ search, status, role, page }),
    [search, status, role, page],
  );
  const { data, isPending, isFetching } = useAdminUsers(filter);
  const updateUser = useUpdateUser();
  const forceLogout = useForceLogout();

  const resetPage = () => setPage(1);

  const setUserStatus = async (u: AdminUserRow, next: AccountStatus) => {
    const verb =
      next === "banned" ? "Ban" : next === "suspended" ? "Suspend" : "Restore";
    if (next !== "active") {
      const ok = await toastConfirm({
        message: `${verb} ${u.name}? They will ${
          next === "banned" ? "lose access permanently" : "be unable to sign in"
        }.`,
        confirmLabel: verb,
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      await updateUser.mutateAsync({ id: u.id, status: next });
      toastSuccess(`${u.name} ${next === "active" ? "restored" : `${next}`}`);
    } catch {
      toastError("Action failed");
    }
  };

  const changeRole = async (u: AdminUserRow, next: AdminRole) => {
    if (next === u.role) return;
    try {
      await updateUser.mutateAsync({ id: u.id, role: next });
      toastSuccess(`${u.name} is now ${next}`);
    } catch {
      toastError("Could not change role");
    }
  };

  const logout = async (u: AdminUserRow) => {
    try {
      await forceLogout.mutateAsync(u.id);
      toastSuccess(`${u.name} signed out of all sessions`);
    } catch {
      toastError("Action failed");
    }
  };

  const columns: Column<AdminUserRow>[] = [
    {
      key: "user",
      header: "User",
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} src={u.profilePicture} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{u.name}</p>
            <p className="truncate text-xs text-slate-400">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (u) => (
        <select
          value={u.role}
          onChange={(e) => changeRole(u, e.target.value as AdminRole)}
          disabled={updateUser.isPending}
          className="rounded-lg border border-surface-border bg-white px-2 py-1 text-xs font-medium capitalize text-slate-700 outline-none focus:border-brand-500"
        >
          {(["user", "moderator", "admin"] as AdminRole[]).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (u) => (
        <Badge tone={statusTone(u.status)} className="capitalize">
          {u.status}
        </Badge>
      ),
    },
    {
      key: "presence",
      header: "Presence",
      render: (u) =>
        u.isOnline ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Online
          </span>
        ) : (
          <span className="text-xs text-slate-400">{relativeTime(u.lastSeen)}</span>
        ),
    },
    {
      key: "reports",
      header: "Reports",
      className: "tabular-nums",
      render: (u) =>
        u.reportsAgainst > 0 ? (
          <Badge tone="rose">{u.reportsAgainst}</Badge>
        ) : (
          <span className="text-slate-300">0</span>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      render: (u) => {
        const isAdmin = u.role === "admin";
        return (
          <div className="flex justify-end gap-1.5">
            {u.isOnline && (
              <button
                type="button"
                onClick={() => logout(u)}
                className="btn-secondary !px-2.5 !py-1 text-xs"
              >
                Logout
              </button>
            )}
            {u.status === "active" ? (
              <button
                type="button"
                disabled={isAdmin}
                onClick={() => setUserStatus(u, "suspended")}
                className="btn-secondary !px-2.5 !py-1 text-xs disabled:opacity-40"
              >
                Suspend
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setUserStatus(u, "active")}
                className="btn-secondary !px-2.5 !py-1 text-xs"
              >
                Restore
              </button>
            )}
            {u.status !== "banned" && (
              <button
                type="button"
                disabled={isAdmin}
                onClick={() => setUserStatus(u, "banned")}
                className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-40"
              >
                Ban
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            resetPage();
          }}
          placeholder="Search name or email"
        />
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as AdminUsersFilter["status"]);
              resetPage();
            }}
            className="input-field !w-auto !py-2.5 text-sm capitalize"
          >
            {STATUS_OPTS.map((o) => (
              <option key={o} value={o}>
                {o === "all" ? "All statuses" : o}
              </option>
            ))}
          </select>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as AdminUsersFilter["role"]);
              resetPage();
            }}
            className="input-field !w-auto !py-2.5 text-sm capitalize"
          >
            {ROLE_OPTS.map((o) => (
              <option key={o} value={o}>
                {o === "all" ? "All roles" : o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AdminTable
        columns={columns}
        rows={data?.users}
        rowKey={(u) => u.id}
        loading={isPending}
        refreshing={isFetching && !isPending}
        emptyLabel="No users match these filters"
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
