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
        />

        <div className="page-content">
          <div className="page-container space-y-3 sm:space-y-5 lg:space-y-6">
            <div className="tab-pills gap-1.5 sm:gap-2">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`tab-pill ${
                    tab === t.key ? "tab-pill-active" : "tab-pill-inactive"
                  }`}
                >
                  {t.label}
                  {t.count > 0 && (
                    <span
                      className={`ml-1.5 rounded-full px-1.5 text-xs ${
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
              <FriendRowSkeleton count={4} />
            ) : tab === "friends" ? (
              friends.length === 0 ? (
                <EmptyState
                  title="No friends yet"
                  description="Discover people and send friend requests to connect"
                />
              ) : (
                <div className="grid animate-fade-in gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
                  {friends.map((friend) => (
                    <Link
                      key={friend.id}
                      href={`/users/${friend.id}`}
                      className="friend-card card flex items-center gap-3 p-3 transition hover:shadow-md sm:gap-4 sm:p-4"
                    >
                      <span className="shrink-0 sm:hidden">
                        <Avatar
                          src={friend.profilePicture}
                          name={friend.name}
                          size="md"
                        />
                      </span>
                      <span className="hidden shrink-0 sm:inline-flex">
                        <Avatar
                          src={friend.profilePicture}
                          name={friend.name}
                          size="lg"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 sm:text-base">
                          {friend.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 sm:text-sm">
                          {friend.email}
                        </p>
                      </div>
                      <PrefetchLink
                        href={`/chat/${friend.id}`}
                        prefetchUserId={friend.id}
                        prefetchChat
                        onClick={(e) => e.stopPropagation()}
                        className="btn-primary shrink-0 !px-3 !py-1.5 text-xs sm:!px-4 sm:!py-2 sm:text-sm"
                      >
                        Message
                      </PrefetchLink>
                    </Link>
                  ))}
                </div>
              )
            ) : tab === "received" ? (
              received.length === 0 ? (
                <EmptyState title="No pending requests" />
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {received.map((req) => (
                    <div
                      key={req.id}
                      className="request-card card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                        <span className="shrink-0 sm:hidden">
                          <Avatar
                            src={req.sender?.profilePicture}
                            name={req.sender?.name ?? "User"}
                            size="md"
                          />
                        </span>
                        <span className="hidden shrink-0 sm:inline-flex">
                          <Avatar
                            src={req.sender?.profilePicture}
                            name={req.sender?.name ?? "User"}
                            size="lg"
                          />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold sm:text-base">
                            {req.sender?.name ?? "Unknown"}
                          </p>
                          <p className="truncate text-xs text-slate-500 sm:text-sm">
                            {req.sender?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => respond(req.id, "accept")}
                          className="btn-primary flex-1 sm:flex-none"
                        >
                          Accept
                        </button>
                        <button
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
              <div className="space-y-2 sm:space-y-3">
                {sent.map((req) => (
                  <div
                    key={req.id}
                    className="request-card card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                      <span className="shrink-0 sm:hidden">
                        <Avatar
                          src={req.receiver?.profilePicture}
                          name={req.receiver?.name ?? "User"}
                          size="md"
                        />
                      </span>
                      <span className="hidden shrink-0 sm:inline-flex">
                        <Avatar
                          src={req.receiver?.profilePicture}
                          name={req.receiver?.name ?? "User"}
                          size="lg"
                        />
                      </span>
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
                      className="btn-secondary w-full text-xs sm:w-auto sm:text-sm"
                    >
                      Cancel request
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
