import { Skeleton, SkeletonCircle } from "./Skeleton";

export function ChatListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-surface-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 sm:px-6">
          <SkeletonCircle size="h-12 w-12" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex justify-between gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-48 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="page-container mx-auto flex max-w-2xl flex-col gap-3 py-2">
      {Array.from({ length: count }).map((_, i) => {
        const isOwn = i % 3 === 1;
        return (
          <div
            key={i}
            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <Skeleton
              className={`h-14 rounded-2xl ${
                isOwn ? "w-[55%] rounded-br-sm" : "w-[48%] rounded-bl-sm"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="card w-full animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
        <div className="h-4 w-32 rounded bg-slate-200" />
      </div>
      <div className="h-24 w-full rounded-xl bg-slate-200" />
    </div>
  );
}

export function FeedSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="w-full space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className="card overflow-hidden !p-0">
      <div className="flex items-center gap-3 p-4">
        <SkeletonCircle size="h-14 w-14" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="border-t border-surface-border px-4 py-3">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function UsersGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="section-grid">
      {Array.from({ length: count }).map((_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="content-section pb-6">
      <div className="md:grid md:grid-cols-[minmax(280px,360px)_1fr] md:gap-6 lg:gap-8">
      <div className="space-y-4">
      <div className="card flex flex-col items-center py-8">
        <SkeletonCircle size="h-24 w-24" />
        <Skeleton className="mt-4 h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-24" />
      </div>
      <div className="card space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
      </div>
      <div className="card space-y-4">
        <Skeleton className="h-4 w-16" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
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
          className="friend-row flex items-center gap-3 md:gap-4 md:p-4"
        >
          <SkeletonCircle size="h-14 w-14" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="section-stack">
      <div className="card flex flex-col items-center py-8">
        <SkeletonCircle size="h-24 w-24" />
        <Skeleton className="mt-4 h-6 w-40" />
        <Skeleton className="mt-2 h-4 w-48" />
      </div>
      <div className="card space-y-4">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
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
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
