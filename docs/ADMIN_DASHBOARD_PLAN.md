# Connectify — Admin Dashboard Implementation Plan

> Status: **Proposed** · Scope: **Privacy-safe** (aggregate metrics + public-content moderation + report-driven action; no private DM reading) · Author: planning doc

This plan covers both repos:

- **`connectify-frontend`** (this repo) — the admin UI.
- **`connectify-backend`** (separate repo) — role system, admin-only endpoints, audit logging.

The frontend can be built first against the **API contract** in section 4; the backend implements the matching endpoints.

---

## 1. Guiding principles (how Facebook / WhatsApp actually run this)

1. **Never read private messages.** WhatsApp is end-to-end encrypted — staff *cannot* see DM content. Facebook acts on private content only via **user reports**. We mirror this: admins see **aggregate counts and metadata**, moderate **public content** (posts, comments, profiles), and act on private content **only through a reports queue**.
2. **RBAC + least privilege.** Tiered roles (`user` → `moderator` → `admin`). Every admin route is server-guarded; the UI guard is convenience only, never the security boundary.
3. **Audit everything.** Every privileged action (ban, delete, role change) is written to an immutable audit log: who, what, when, why.
4. **Aggregate over surveillance.** Show DAU/MAU, signups, messages/day as **numbers**, not as a feed of who-said-what.
5. **Reversible actions.** Prefer suspend/restore and hide/unhide over hard delete. Hard delete is logged and confirmed.

---

## 2. Current-state assessment

| Area | Today | Gap for admin |
|---|---|---|
| Roles | `User` has no `role` field (`src/types/index.ts`) | Add `role` end-to-end |
| Auth | JWT in `localStorage`, `/auth/me` returns user | `role` must be in the JWT claims + `/auth/me` payload |
| Route guard | `ProtectedRoute.tsx` (logged-in only) | Need `RequireAdmin` (role check) |
| `/dashboard` | User's own profile editor (misnamed) | Admin lives at new `/admin`, unrelated |
| Nav | `Sidebar.tsx` static `navItems` | Conditionally show "Admin" for staff |
| Data fetching | `src/lib/api.ts` + TanStack Query hooks in `hooks/queries.ts` | New admin hooks, same pattern |
| Charts | none | Add `recharts` (only new dependency) |

---

## 3. Backend work (connectify-backend — separate repo)

### 3.1 Data model changes
- **User:** add `role: 'user' | 'moderator' | 'admin'` (default `'user'`), `status: 'active' | 'suspended' | 'banned'` (default `'active'`), `suspendedUntil?: Date`.
- **Report** (new collection): `{ reporterId, targetType: 'post'|'comment'|'user'|'message', targetId, reason, note?, status: 'open'|'resolved'|'dismissed', resolvedBy?, resolvedAt?, createdAt }`.
- **AuditLog** (new collection): `{ actorId, action, targetType, targetId, metadata, createdAt }` — append-only.

### 3.2 Middleware
- `requireAuth` (exists) → `requireRole('moderator' | 'admin')`. Reject with 403 otherwise. **This is the real security boundary.**
- Bump `role` into the JWT and into `/auth/me` so the client knows it.

### 3.3 Endpoints (admin-only)
See the contract in section 4 — backend must implement those exact shapes.

### 3.4 Reporting (powers the moderation queue)
- Public endpoint `POST /reports` so any user can report a post/comment/user. This is the privacy-safe substitute for "reading messages."

---

## 4. API contract (frontend builds against this)

All responses use the existing envelope `{ success, data, message? }` (`ApiResponse<T>`). All admin routes require a `moderator`/`admin` JWT.

```
GET  /admin/stats
  → { users:{ total, active, suspended, banned, onlineNow, newToday, newThisWeek },
      content:{ postsTotal, postsToday, commentsToday },
      messaging:{ messagesToday, callsToday },           // counts only, no content
      reports:{ open, resolvedToday },
      series:{ signups:[{date,count}], messages:[{date,count}] } }  // last 14 days

GET  /admin/users?search=&status=&role=&page=&limit=
  → { users:[{ id,name,email,role,status,isOnline,lastSeen,createdAt,
               postsCount,reportsAgainst }],
      pagination:{ page,limit,total,totalPages } }

PATCH /admin/users/:id      body { status?, role?, suspendedUntil? }   → { user }
POST  /admin/users/:id/force-logout                                   → { success }

GET   /admin/posts?search=&reportedOnly=&page=&limit=
  → { posts:[{ id,content,imageUrl,author,likesCount,commentsCount,
               reportsCount,createdAt,hidden }], pagination }
PATCH /admin/posts/:id       body { hidden }                          → { post }
DELETE /admin/posts/:id                                               → { success }

GET   /admin/reports?status=open&page=&limit=
  → { reports:[{ id,reporter,targetType,targetId,targetPreview,reason,note,
                 status,createdAt }], pagination }
PATCH /admin/reports/:id     body { status:'resolved'|'dismissed', action? } → { report }

GET   /admin/audit?page=&limit=
  → { entries:[{ id,actor,action,targetType,targetId,metadata,createdAt }], pagination }

GET   /admin/health
  → { socketConnections, apiOk, dbOk, uptimeSeconds, presenceCount }

POST  /reports               body { targetType,targetId,reason,note? }  → { report }   // any user
```

---

## 5. Frontend work (this repo)

### 5.1 New files
```
src/app/admin/layout.tsx              # RequireAdmin + admin shell (sidebar tabs)
src/app/admin/page.tsx                # Overview (KPIs + charts)
src/app/admin/users/page.tsx          # User management table
src/app/admin/content/page.tsx        # Posts/comments moderation
src/app/admin/reports/page.tsx        # Moderation queue
src/app/admin/health/page.tsx         # System health + audit log
src/components/admin/StatCard.tsx
src/components/admin/AdminTable.tsx    # reusable table (sort/paginate)
src/components/admin/RequireAdmin.tsx  # role guard, redirects non-admins
src/hooks/adminQueries.ts             # TanStack Query hooks for /admin/*
src/lib/adminKeys.ts                  # query keys (mirror queryKeys.ts)
```

### 5.2 Type changes (`src/types/index.ts`)
- Add to `User`: `role?: 'user' | 'moderator' | 'admin'`, `status?: 'active' | 'suspended' | 'banned'`.
- New types: `AdminStats`, `AdminUserRow`, `AdminPostRow`, `Report`, `AuditEntry`, `SystemHealth`.

### 5.3 Guard & nav
- `RequireAdmin`: read `user.role` from `useAuth()`; if not `admin`/`moderator`, redirect to `/dashboard`. (Backend still enforces — this is UX only.)
- `Sidebar.tsx`: append an "Admin" nav item rendered only when `user?.role` is `admin`/`moderator`.

### 5.4 Pages (build order)
1. **Overview** — `StatCard` grid (users, online now, posts today, messages today, open reports) + two `recharts` line charts (signups, messages, 14-day). Polls `/admin/stats` via React Query (`refetchInterval`).
2. **Users** — `AdminTable`: search, status/role filters, row actions Suspend / Ban / Restore / Force-logout with `toastConfirm` (you already have it). Optimistic update + invalidate.
3. **Content** — posts table, "reported only" filter, Hide/Unhide/Delete.
4. **Reports** — queue cards; Resolve (with action) / Dismiss; links to the target.
5. **Health** — health tiles + paginated audit-log table.

### 5.5 Conventions to match existing code
- Data fetching via the `api<T>()` helper + `useQuery`/`useInfiniteQuery` (same as `hooks/queries.ts`).
- Confirmations via `lib/toastConfirm.tsx`; toasts via `lib/toast.ts`.
- Skeletons via `components/skeletons`. Tailwind utility classes / `card`, `btn-primary` patterns already in the codebase.

---

## 6. Phased delivery

| Phase | Deliverable | Depends on backend? |
|---|---|---|
| 1 | Types + `RequireAdmin` + `/admin` layout + conditional nav | role in `/auth/me` |
| 2 | Overview dashboard (KPIs + charts) | `GET /admin/stats` |
| 3 | User management (table + actions) | `/admin/users*` |
| 4 | Content + Reports moderation | `/admin/posts*`, `/admin/reports*`, `POST /reports` |
| 5 | System health + audit log | `/admin/health`, `/admin/audit` |

Frontend phases can be built with **mock data** ahead of the backend by stubbing the `adminQueries.ts` hooks, then flipping to real endpoints.

---

## 7. Security checklist (do not skip)

- [ ] Server-side `requireRole` on **every** `/admin/*` route — never trust the client guard.
- [ ] `role` is set server-side only; never accept it from registration input.
- [ ] First admin is seeded via a script/env, not a public endpoint.
- [ ] Rate-limit admin mutations; log all to `AuditLog`.
- [ ] No message **content** in any admin endpoint — counts/metadata only.
- [ ] Hard deletes require explicit confirm + audit entry.
- [ ] Consider moving the JWT off `localStorage` to an httpOnly cookie (XSS hardening) — optional, larger change.

---

## 8. Recommended next actions

1. Backend: add `role`/`status` to User, `requireRole` middleware, and put `role` in the JWT + `/auth/me`. (Unblocks Phase 1.)
2. Frontend: I build Phase 1 against the contract above (mock data where backend isn't ready yet).
3. Iterate phase by phase, wiring real endpoints as they land.
