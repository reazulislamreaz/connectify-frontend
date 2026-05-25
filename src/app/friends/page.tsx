"use client";

import { useState } from "react";
import Link from "next/link";
import { PrefetchLink } from "@/components/PrefetchLink";
import { useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Avatar } from "@/components/Avatar";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { FriendRowSkeleton } from "@/components/skeletons";
import { api } from "@/lib/api";
import { invalidateFriends } from "@/lib/invalidateCache";
import {
  useFriendsQuery,
  useFriendReceivedQuery,
  useFriendSentQuery,
} from "@/hooks/queries";
import { toastError, toastSuccess } from "@/lib/toast";

type Tab = "friends" | "received" | "sent";

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

function FriendAvatar({
  src,
  name,
}: {
  src?: string;
  name: string;
}) {
  return (
    <>
      <span className="shrink-0 sm:hidden">
        <Avatar src={src} name={name} size="sm" />
      </span>
      <span className="hidden shrink-0 sm:inline-flex">
        <Avatar src={src} name={name} size="lg" />
      </span>
    </>
  );
}

export default function FriendsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("friends");

  const friendsQuery = useFriendsQuery();
  const receivedQuery = useFriendReceivedQuery();
  const sentQuery = useFriendSentQuery();

  const friends = friendsQuery.data ?? [];
  const received = receivedQuery.data ?? [];
  const sent = sentQuery.data ?? [];
  const hasAnyData =
    (friendsQuery.data?.length ?? 0) > 0 ||
    (receivedQuery.data?.length ?? 0) > 0 ||
    (sentQuery.data?.length ?? 0) > 0;

  const loading =
    !hasAnyData &&
    (friendsQuery.isPending ||
      receivedQuery.isPending ||
      sentQuery.isPending);

  const refreshing =
    !loading &&
    (friendsQuery.isFetching ||
      receivedQuery.isFetching ||
      sentQuery.isFetching);

  const respond = async (id: string, action: "accept" | "reject") => {
    try {
      await api(`/friend-requests/${id}/respond`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      toastSuccess(
        action === "accept" ? "Friend request accepted" : "Request declined",
      );
      await invalidateFriends(queryClient);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const cancelRequest = async (id: string) => {
    try {
      await api(`/friend-requests/${id}`, { method: "DELETE" });
      toastSuccess("Friend request cancelled");
      await invalidateFriends(queryClient);
    } catch (err) {
      toastError(err instanceof Error ? err.message : "Failed to cancel request");
    }
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "friends", label: "Friends", count: friends.length },
    { key: "received", label: "Received", count: received.length },
    { key: "sent", label: "Sent", count: sent.length },
  ];

  return (
    <AppLayout>
      <div className="page-shell friends-page">
        <PageHeader
          title="Friends"
          subtitle="Manage your connections and requests"
          refreshing={refreshing}
          compact
        />

        <div className="page-content">
          <div className="page-container space-y-2.5 sm:space-y-5 lg:space-y-6">
            <div className="friends-tabs tab-pills gap-1.5 sm:gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`tab-pill ${
                    tab === t.key ? "tab-pill-active" : "tab-pill-inactive"
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span
                      className={`ml-1.5 rounded-full px-1.5 text-xs sm:ml-1.5 ${
                        tab === t.key ? "bg-white/25" : "bg-slate-200/80"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
            {loading ? (
              <FriendRowSkeleton count={5} />
            ) : tab === "friends" ? (
              friends.length === 0 ? (
                <EmptyState
                  title="No friends yet"
                  description="Discover people and send friend requests to connect"
                />
              ) : (
                <div className="friends-list-panel animate-fade-in sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none xl:grid-cols-3">
                  {friends.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/users/${friend.id}`}
                      className="friend-row flex items-center transition sm:card sm:min-h-0 sm:gap-4 sm:border sm:p-4 sm:hover:shadow-md"
                    >
                      <FriendAvatar
                        src={friend.profilePicture}
                        name={friend.name}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                          {friend.name}
                        </p>
                        <p className="hidden truncate text-xs text-slate-500 sm:block sm:text-sm">
                          {friend.email}
                        </p>
                      </div>
                      <PrefetchLink
                        href={`/chat/${friend.id}`}
                        prefetchUserId={friend.id}
                        prefetchChat
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Message ${friend.name}`}
                        className="btn-primary flex h-8 w-8 shrink-0 items-center justify-center !p-0 sm:h-auto sm:w-auto sm:!px-4 sm:!py-2 sm:text-sm"
                      >
                        <MessageIcon className="h-4 w-4 sm:hidden" />
                        <span className="hidden sm:inline">Message</span>
                      </PrefetchLink>
                    </Link>
                  ))}
                </div>
              )
            ) : tab === "received" ? (
              received.length === 0 ? (
                <EmptyState title="No pending requests" />
              ) : (
                <div className="friends-request-panel sm:space-y-3 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none">
                  {received.map((req) => (
                    <div
                      key={req.id}
                      className="request-row flex flex-col gap-2 sm:card sm:flex-row sm:items-center sm:gap-4 sm:border sm:p-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4">
                        <FriendAvatar
                          src={req.sender?.profilePicture}
                          name={req.sender?.name ?? "User"}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold sm:text-base">
                            {req.sender?.name ?? "Unknown"}
                          </p>
                          <p className="hidden truncate text-xs text-slate-500 sm:block sm:text-sm">
                            {req.sender?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:shrink-0">
                        <button
                          type="button"
                          onClick={() => respond(req.id, "accept")}
                          className="btn-primary flex-1 sm:flex-none"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => respond(req.id, "reject")}
                          className="btn-secondary flex-1 sm:flex-none"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : sent.length === 0 ? (
              <EmptyState title="No sent requests" />
            ) : (
              <div className="friends-request-panel sm:space-y-3 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent sm:shadow-none">
                {sent.map((req) => (
                  <div
                    key={req.id}
                    className="request-row flex flex-col gap-2 sm:card sm:flex-row sm:items-center sm:gap-4 sm:border sm:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4">
                      <FriendAvatar
                        src={req.receiver?.profilePicture}
                        name={req.receiver?.name ?? "User"}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold sm:text-base">
                          {req.receiver?.name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-amber-600 sm:text-sm">
                          Pending
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => cancelRequest(req.id)}
                      className="btn-secondary w-full text-xs sm:ml-auto sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
