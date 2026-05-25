import { Skeleton, SkeletonCircle } from "./Skeleton";

export function ChatListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-surface-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4"
        >
          <SkeletonCircle size="h-10 w-10" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <Skeleton className="h-4 w-28 max-w-[60%]" />
              <Skeleton className="h-3 w-10 shrink-0" />
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              {i % 3 === 0 && (
                <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton({ count = 8 }: { count?: number }) {
  const widths = ["w-[42%]", "w-[55%]", "w-[38%]", "w-[52%]", "w-[48%]", "w-[36%]", "w-[58%]", "w-[44%]"];
  const heights = ["h-10", "h-14", "h-20", "h-12", "h-16", "h-10", "h-24", "h-12"];

  return (
    <div className="page-container mx-auto flex max-w-2xl flex-col gap-1.5 py-2 lg:max-w-3xl xl:max-w-4xl">
      {Array.from({ length: count }).map((_, i) => {
        const isOwn = i % 3 === 1;
        return (
          <div
            key={i}
            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <Skeleton
              className={`rounded-2xl ${heights[i % heights.length]} ${widths[i % widths.length]} ${
                isOwn ? "rounded-br-sm" : "rounded-bl-sm"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function PostCardSkeleton({ withImage = true }: { withImage?: boolean }) {
  return (
    <article className="card overflow-hidden !p-0">
      <div className="flex items-center gap-3 p-4 pb-0">
        <SkeletonCircle size="h-10 w-10" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>

      <div className="space-y-2 px-4 py-3">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[80%]" />
      </div>

      {withImage && (
        <Skeleton className="min-h-64 w-full rounded-none border-y border-transparent" />
      )}

      <div className="flex items-center gap-1 border-t border-surface-border px-2 py-1">
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-16 rounded-lg" />
      </div>
    </article>
  );
}

export function FeedSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} withImage={i % 2 === 0} />
      ))}
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <article className="card overflow-hidden !p-0">
      <div className="flex items-center gap-3 p-4">
        <SkeletonCircle size="h-16 w-16" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-4 w-32 max-w-[70%]" />
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
          </div>
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <div className="border-t border-surface-border px-4 py-3">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </article>
  );
}

export function UsersGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="section-grid users-page-grid">
      {Array.from({ length: count }).map((_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </div>
  );
}

function ProfileDetailRowSkeleton() {
  return (
    <div className="flex min-w-0 gap-3 overflow-hidden rounded-xl bg-wa-panel/60 px-4 py-3">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full max-w-xs" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="content-section pb-6">
      <div className="space-y-4 md:grid md:grid-cols-[minmax(280px,360px)_1fr] md:items-start md:gap-6 md:space-y-0 lg:gap-8">
        <div className="space-y-4">
          <div className="card flex flex-col items-center py-8 text-center">
            <SkeletonCircle size="h-24 w-24" />
            <Skeleton className="mt-4 h-6 w-40" />
            <Skeleton className="mt-2 h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-1 h-3 w-20" />
          </div>
          <div className="card space-y-3 p-4 md:space-y-4 md:p-5 lg:p-6">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        <div className="card min-w-0 space-y-3 overflow-hidden md:mt-0">
          <Skeleton className="h-4 w-14" />
          {Array.from({ length: 5 }).map((_, i) => (
            <ProfileDetailRowSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FriendRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="friends-list-panel">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="friend-row flex items-center gap-3 md:gap-4"
        >
          <SkeletonCircle size="h-16 w-16" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3.5 w-44 max-w-full" />
          </div>
          <Skeleton className="h-9 w-24 shrink-0 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="section-stack">
      <div className="card flex flex-col items-center py-8 text-center">
        <SkeletonCircle size="h-24 w-24" />
        <Skeleton className="mt-4 h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>

      <div className="form-card overflow-hidden">
        <div className="form-card-header">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-48" />
            </div>
          </div>
        </div>
        <div className="form-card-body space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
        <div className="form-actions">
          <Skeleton className="h-10 w-full rounded-xl sm:w-40" />
        </div>
      </div>

      <div className="card flex items-center gap-4">
        <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3.5 w-40" />
        </div>
        <Skeleton className="h-5 w-5 shrink-0 rounded" />
      </div>
    </div>
  );
}

export function CommentListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-2">
          <SkeletonCircle size="h-8 w-8" />
          <div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 shadow-sm">
            <Skeleton className="h-3 w-20" />
            <Skeleton className={`mt-2 ${i % 2 === 0 ? "h-8" : "h-12"} w-full`} />
            <Skeleton className="mt-1.5 h-2.5 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
