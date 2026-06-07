"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import { adminKeys } from "@/lib/adminKeys";
import type {
  AdminPostsFilter,
  AdminReportsFilter,
  AdminUsersFilter,
} from "@/lib/adminKeys";
import {
  ADMIN_PAGE_SIZE,
  mockDeletePost,
  mockForceLogout,
  mockGetAudit,
  mockGetHealth,
  mockGetPosts,
  mockGetReports,
  mockGetStats,
  mockGetUsers,
  mockPatchPost,
  mockPatchUser,
  mockResolveReport,
} from "@/lib/adminMock";
import type {
  AccountStatus,
  AdminAuditResponse,
  AdminPostsResponse,
  AdminReportsResponse,
  AdminRole,
  AdminStats,
  AdminUsersResponse,
  ApiResponse,
  ReportStatus,
  SystemHealth,
} from "@/types";

/**
 * Mock mode is OFF — the admin dashboard now talks to the real /admin/*
 * endpoints in connectify-backend. Set back to `true` to demo without a backend.
 */
export const ADMIN_USE_MOCK = false;

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== "all") sp.set(k, String(v));
  }
  sp.set("limit", String(ADMIN_PAGE_SIZE));
  return sp.toString();
};

/* ─────────────────────────────── reads ─────────────────────────────── */

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: async () => {
      if (ADMIN_USE_MOCK) return mockGetStats();
      const res = await api<ApiResponse<AdminStats>>("/admin/stats");
      return res.data;
    },
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useAdminHealth() {
  return useQuery({
    queryKey: adminKeys.health,
    queryFn: async () => {
      if (ADMIN_USE_MOCK) return mockGetHealth();
      const res = await api<ApiResponse<SystemHealth>>("/admin/health");
      return res.data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export function useAdminUsers(filter: AdminUsersFilter) {
  return useQuery({
    queryKey: adminKeys.users(filter),
    queryFn: async () => {
      if (ADMIN_USE_MOCK) return mockGetUsers(filter);
      const res = await api<ApiResponse<AdminUsersResponse>>(
        `/admin/users?${qs({
          search: filter.search,
          status: filter.status,
          role: filter.role,
          page: filter.page,
        })}`,
      );
      return res.data;
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminPosts(filter: AdminPostsFilter) {
  return useQuery({
    queryKey: adminKeys.posts(filter),
    queryFn: async () => {
      if (ADMIN_USE_MOCK) return mockGetPosts(filter);
      const res = await api<ApiResponse<AdminPostsResponse>>(
        `/admin/posts?${qs({
          search: filter.search,
          reportedOnly: filter.reportedOnly,
          page: filter.page,
        })}`,
      );
      return res.data;
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminReports(filter: AdminReportsFilter) {
  return useQuery({
    queryKey: adminKeys.reports(filter),
    queryFn: async () => {
      if (ADMIN_USE_MOCK) return mockGetReports(filter);
      const res = await api<ApiResponse<AdminReportsResponse>>(
        `/admin/reports?${qs({ status: filter.status, page: filter.page })}`,
      );
      return res.data;
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminAudit(page: number) {
  return useQuery({
    queryKey: adminKeys.audit(page),
    queryFn: async () => {
      if (ADMIN_USE_MOCK) return mockGetAudit(page);
      const res = await api<ApiResponse<AdminAuditResponse>>(
        `/admin/audit?${qs({ page })}`,
      );
      return res.data;
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

/* ──────────────────────────── mutations ────────────────────────────── */

/** Invalidate every admin query so counts/tables/audit stay coherent. */
function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: adminKeys.all });
}

export function useUpdateUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      status?: AccountStatus;
      role?: AdminRole;
    }) => {
      if (ADMIN_USE_MOCK) return mockPatchUser(vars.id, vars);
      return api(`/admin/users/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status, role: vars.role }),
      });
    },
    onSuccess: invalidate,
  });
}

export function useForceLogout() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (id: string) => {
      if (ADMIN_USE_MOCK) return mockForceLogout(id);
      return api(`/admin/users/${id}/force-logout`, { method: "POST" });
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePost() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (vars: { id: string; hidden: boolean }) => {
      if (ADMIN_USE_MOCK) return mockPatchPost(vars.id, vars.hidden);
      return api(`/admin/posts/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ hidden: vars.hidden }),
      });
    },
    onSuccess: invalidate,
  });
}

export function useDeletePost() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (id: string) => {
      if (ADMIN_USE_MOCK) return mockDeletePost(id);
      return api(`/admin/posts/${id}`, { method: "DELETE" });
    },
    onSuccess: invalidate,
  });
}

export function useResolveReport() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (vars: {
      id: string;
      status: Extract<ReportStatus, "resolved" | "dismissed">;
      action?: string;
    }) => {
      if (ADMIN_USE_MOCK)
        return mockResolveReport(vars.id, vars.status, vars.action);
      return api(`/admin/reports/${vars.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: vars.status, action: vars.action }),
      });
    },
    onSuccess: invalidate,
  });
}
