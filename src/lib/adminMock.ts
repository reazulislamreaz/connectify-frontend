/**
 * In-memory mock backend for the admin dashboard.
 *
 * It exists so the entire admin UI is demo-ready before the real `/admin/*`
 * endpoints land. Data is seeded deterministically (stable across refetches),
 * and mutations actually mutate the store + append to the audit log so the
 * flows feel real. State resets on full page reload.
 *
 * To switch to the real backend, set ADMIN_USE_MOCK = false in adminQueries.ts
 * — the response shapes here match the documented API contract exactly.
 */
import type {
  AccountStatus,
  AdminPostRow,
  AdminRole,
  AdminStats,
  AuditEntry,
  Pagination,
  PostAuthor,
  Report,
  ReportStatus,
  ReportTargetType,
  SystemHealth,
  TimePoint,
} from "@/types";
import type {
  AdminPostsFilter,
  AdminReportsFilter,
  AdminUsersFilter,
} from "@/lib/adminKeys";

export const ADMIN_PAGE_SIZE = 12;

// ── tiny deterministic PRNG so seed data is stable across renders ──────────
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260607);
const pick = <T>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const int = (min: number, max: number) =>
  Math.floor(rnd() * (max - min + 1)) + min;

// Reference "now" captured once at module load → relative dates stay coherent.
const NOW = Date.now();
const DAY = 86_400_000;
const isoDaysAgo = (days: number, jitterMs = 0) =>
  new Date(NOW - days * DAY - jitterMs).toISOString();
const dateKeyDaysAgo = (days: number) =>
  new Date(NOW - days * DAY).toISOString().slice(0, 10);

const FIRST = [
  "Aisha", "Rahim", "Tanvir", "Nadia", "Sourav", "Priya", "Hasan", "Mehjabin",
  "Arif", "Sadia", "Imran", "Lamia", "Rafi", "Sumaiya", "Zayan", "Farhana",
  "Niloy", "Tasnia", "Shakib", "Mitu", "Rumana", "Jubayer", "Oishe", "Mahin",
];
const LAST = [
  "Ahmed", "Khan", "Islam", "Hossain", "Rahman", "Akter", "Chowdhury", "Das",
  "Sarkar", "Mahmud", "Begum", "Roy",
];
const REPORT_REASONS = [
  "Spam or scam", "Harassment", "Hate speech", "Nudity or sexual content",
  "Violence", "Impersonation", "Misinformation",
];
const POST_SNIPPETS = [
  "Just shipped a new feature 🚀", "Beautiful sunset today 🌇",
  "Anyone up for a football match this weekend?", "Loving the new café downtown ☕",
  "Throwback to last year's trip 🏔️", "Made some homemade biryani 🍛",
  "Need book recommendations 📚", "Finally finished my side project!",
  "Happy Friday everyone 🎉", "Working from a new spot today 💻",
];

function makeAuthor(id: number): PostAuthor & { email: string } {
  const name = `${pick(FIRST)} ${pick(LAST)}`;
  return {
    id: `u_${id}`,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}${id}@example.com`,
  };
}

// ── seed: users ────────────────────────────────────────────────────────────
const ROLE_BY_INDEX = (i: number): AdminRole =>
  i === 0 ? "admin" : i === 1 ? "moderator" : "user";

function seedUsers() {
  return Array.from({ length: 48 }, (_, i) => {
    const a = makeAuthor(i + 1);
    const r = rnd();
    const status: AccountStatus =
      i < 3 ? "active" : r > 0.93 ? "banned" : r > 0.85 ? "suspended" : "active";
    return {
      id: a.id,
      name: a.name,
      email: a.email,
      profilePicture: undefined,
      role: ROLE_BY_INDEX(i),
      status,
      isOnline: rnd() > 0.6,
      lastSeen: isoDaysAgo(0, int(0, 6) * 3_600_000),
      createdAt: isoDaysAgo(int(0, 120)),
      postsCount: int(0, 40),
      reportsAgainst: status === "active" ? int(0, 2) : int(1, 9),
    };
  });
}

function seedPosts() {
  return Array.from({ length: 34 }, (_, i) => {
    const a = makeAuthor(int(1, 48));
    const reports = rnd() > 0.7 ? int(1, 6) : 0;
    return {
      id: `p_${i + 1}`,
      content: pick(POST_SNIPPETS),
      imageUrl: undefined,
      author: { id: a.id, name: a.name },
      likesCount: int(0, 240),
      commentsCount: int(0, 60),
      reportsCount: reports,
      hidden: false,
      createdAt: isoDaysAgo(int(0, 30), int(0, 23) * 3_600_000),
    } satisfies AdminPostRow;
  });
}

function seedReports(): Report[] {
  const targetTypes: ReportTargetType[] = ["post", "comment", "user", "message"];
  return Array.from({ length: 16 }, (_, i) => {
    const reporter = makeAuthor(int(1, 48));
    const targetType = pick(targetTypes);
    const status: ReportStatus =
      i < 9 ? "open" : rnd() > 0.5 ? "resolved" : "dismissed";
    return {
      id: `r_${i + 1}`,
      reporter: { id: reporter.id, name: reporter.name },
      targetType,
      targetId: `${targetType[0]}_${int(1, 40)}`,
      targetPreview:
        targetType === "message"
          ? "Message reported by recipient (content hidden)"
          : targetType === "user"
            ? `Profile: ${makeAuthor(int(1, 48)).name}`
            : pick(POST_SNIPPETS),
      reason: pick(REPORT_REASONS),
      note: rnd() > 0.6 ? "Reviewed multiple times by the reporter." : undefined,
      status,
      createdAt: isoDaysAgo(int(0, 14), int(0, 23) * 3_600_000),
    };
  });
}

interface Store {
  users: ReturnType<typeof seedUsers>;
  posts: AdminPostRow[];
  reports: Report[];
  audit: AuditEntry[];
}

const store: Store = {
  users: seedUsers(),
  posts: seedPosts(),
  reports: seedReports(),
  audit: [],
};

// The acting admin (in real life, from the JWT). Used for audit attribution.
const ACTOR: PostAuthor = { id: "u_1", name: store.users[0].name };

function logAudit(
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, string>,
) {
  store.audit.unshift({
    id: `a_${store.audit.length + 1}_${targetId}`,
    actor: ACTOR,
    action,
    targetType,
    targetId,
    metadata,
    createdAt: new Date().toISOString(),
  });
}

// ── simulated network ───────────────────────────────────────────────────────
const LATENCY = 180;
const delay = <T>(value: T): Promise<T> =>
  new Promise((res) => setTimeout(() => res(value), LATENCY));

function paginate<T>(items: T[], page: number): { slice: T[]; pagination: Pagination } {
  const limit = ADMIN_PAGE_SIZE;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * limit;
  return {
    slice: items.slice(start, start + limit),
    pagination: { page: safePage, limit, total, totalPages },
  };
}

// ── reads ───────────────────────────────────────────────────────────────────
export function mockGetStats(): Promise<AdminStats> {
  const u = store.users;
  const series14 = (base: number, spread: number): TimePoint[] =>
    Array.from({ length: 14 }, (_, idx) => ({
      date: dateKeyDaysAgo(13 - idx),
      count: Math.max(0, Math.round(base + Math.sin(idx) * spread + int(-spread, spread))),
    }));

  return delay({
    users: {
      total: u.length,
      active: u.filter((x) => x.status === "active").length,
      suspended: u.filter((x) => x.status === "suspended").length,
      banned: u.filter((x) => x.status === "banned").length,
      onlineNow: u.filter((x) => x.isOnline).length,
      newToday: 7,
      newThisWeek: 34,
    },
    content: {
      postsTotal: store.posts.length + 1280,
      postsToday: 23,
      commentsToday: 98,
    },
    messaging: { messagesToday: 1462, callsToday: 87 },
    reports: {
      open: store.reports.filter((r) => r.status === "open").length,
      resolvedToday: 5,
    },
    series: { signups: series14(9, 5), messages: series14(1300, 280) },
  });
}

export function mockGetUsers(f: AdminUsersFilter) {
  const q = f.search.trim().toLowerCase();
  const filtered = store.users.filter((u) => {
    if (f.status !== "all" && u.status !== f.status) return false;
    if (f.role !== "all" && u.role !== f.role) return false;
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q))
      return false;
    return true;
  });
  const { slice, pagination } = paginate(filtered, f.page);
  return delay({ users: slice, pagination });
}

export function mockGetPosts(f: AdminPostsFilter) {
  const q = f.search.trim().toLowerCase();
  const filtered = store.posts.filter((p) => {
    if (f.reportedOnly && p.reportsCount === 0) return false;
    if (q && !p.content.toLowerCase().includes(q) && !p.author.name.toLowerCase().includes(q))
      return false;
    return true;
  });
  const { slice, pagination } = paginate(filtered, f.page);
  return delay({ posts: slice, pagination });
}

export function mockGetReports(f: AdminReportsFilter) {
  const filtered = store.reports.filter(
    (r) => f.status === "all" || r.status === f.status,
  );
  const { slice, pagination } = paginate(filtered, f.page);
  return delay({ reports: slice, pagination });
}

export function mockGetAudit(page: number) {
  const { slice, pagination } = paginate(store.audit, page);
  return delay({ entries: slice, pagination });
}

export function mockGetHealth(): Promise<SystemHealth> {
  return delay({
    socketConnections: store.users.filter((u) => u.isOnline).length,
    apiOk: true,
    dbOk: true,
    uptimeSeconds: 6 * DAY / 1000 + 14_320,
    presenceCount: store.users.filter((u) => u.isOnline).length,
  });
}

// ── mutations ────────────────────────────────────────────────────────────────
export function mockPatchUser(
  id: string,
  patch: { status?: AccountStatus; role?: AdminRole },
) {
  const u = store.users.find((x) => x.id === id);
  if (!u) return delay({ ok: false });
  if (patch.status && patch.status !== u.status) {
    u.status = patch.status;
    logAudit(`user.${patch.status}`, "user", id, { name: u.name });
  }
  if (patch.role && patch.role !== u.role) {
    logAudit("user.role_change", "user", id, { from: u.role, to: patch.role });
    u.role = patch.role;
  }
  return delay({ ok: true });
}

export function mockForceLogout(id: string) {
  const u = store.users.find((x) => x.id === id);
  if (u) {
    u.isOnline = false;
    logAudit("user.force_logout", "user", id, { name: u.name });
  }
  return delay({ ok: true });
}

export function mockPatchPost(id: string, hidden: boolean) {
  const p = store.posts.find((x) => x.id === id);
  if (p) {
    p.hidden = hidden;
    logAudit(hidden ? "post.hide" : "post.unhide", "post", id);
  }
  return delay({ ok: true });
}

export function mockDeletePost(id: string) {
  const idx = store.posts.findIndex((x) => x.id === id);
  if (idx >= 0) {
    store.posts.splice(idx, 1);
    logAudit("post.delete", "post", id);
  }
  return delay({ ok: true });
}

export function mockResolveReport(
  id: string,
  status: Extract<ReportStatus, "resolved" | "dismissed">,
  action?: string,
) {
  const r = store.reports.find((x) => x.id === id);
  if (r) {
    r.status = status;
    logAudit(`report.${status}`, "report", id, action ? { action } : undefined);
  }
  return delay({ ok: true });
}
