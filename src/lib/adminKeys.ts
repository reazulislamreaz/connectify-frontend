import type { AccountStatus, AdminRole, ReportStatus } from "@/types";

export interface AdminUsersFilter {
  search: string;
  status: AccountStatus | "all";
  role: AdminRole | "all";
  page: number;
}

export interface AdminPostsFilter {
  search: string;
  reportedOnly: boolean;
  page: number;
}

export interface AdminReportsFilter {
  status: ReportStatus | "all";
  page: number;
}

/** Query keys for every /admin/* resource (mirrors lib/queryKeys.ts). */
export const adminKeys = {
  all: ["admin"] as const,
  stats: ["admin", "stats"] as const,
  health: ["admin", "health"] as const,
  users: (f: AdminUsersFilter) => ["admin", "users", f] as const,
  posts: (f: AdminPostsFilter) => ["admin", "posts", f] as const,
  reports: (f: AdminReportsFilter) => ["admin", "reports", f] as const,
  audit: (page: number) => ["admin", "audit", page] as const,
};
