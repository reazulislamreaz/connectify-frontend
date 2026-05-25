"use client";

import Link from "next/link";
import { PrefetchLink } from "@/components/PrefetchLink";
import { Avatar } from "@/components/Avatar";
import { useAuth } from "@/context/AuthContext";
import {
  useChatsQuery,
  useFriendReceivedQuery,
  useFriendsQuery,
} from "@/hooks/queries";

function RailCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-surface-border bg-white p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function DesktopRightRail() {
  const { user } = useAuth();
  const { data: friends = [] } = useFriendsQuery();
  const { data: received = [] } = useFriendReceivedQuery();
  const { data: chats = [] } = useChatsQuery(!!user);

  const onlineFriends = friends.filter((f) => f.isOnline);
  const displayFriends = (onlineFriends.length > 0 ? onlineFriends : friends).slice(
    0,
    8,
  );
  const recentChats = chats.slice(0, 5);

  return (
    <aside className="desktop-right-rail hidden h-full w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-surface-border bg-white p-4 scrollbar-thin lg:flex 2xl:w-[360px]">
      {received.length > 0 && (
        <RailCard
          title="Friend requests"
          action={
            <Link
              href="/friends"
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              See all
            </Link>
          }
        >
          <ul className="space-y-2">
            {received.slice(0, 3).map((req) =>
              req.sender?.id ? (
              <li key={req.id}>
                <PrefetchLink
                  href={`/users/${req.sender.id}`}
                  prefetchUserId={req.sender.id}
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                >
                  <Avatar
                    name={req.sender?.name ?? "User"}
                    src={req.sender?.profilePicture}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {req.sender?.name ?? "Someone"}
                    </p>
                    <p className="text-xs text-brand-600">Wants to connect</p>
                  </div>
                </PrefetchLink>
              </li>
            ) : null,
            )}
          </ul>
        </RailCard>
      )}

      {displayFriends.length > 0 && (
        <RailCard
          title="Contacts"
          action={
            <Link
              href="/friends"
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              See all
            </Link>
          }
        >
          <ul className="space-y-1">
            {displayFriends.map((friend) => (
              <li key={friend.id}>
                <PrefetchLink
                  href={`/chat/${friend.id}`}
                  prefetchUserId={friend.id}
                  prefetchChat
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                >
                  <Avatar
                    name={friend.name}
                    src={friend.profilePicture}
                    size="md"
                    online={friend.isOnline}
                  />
                  <span className="truncate text-sm font-medium text-slate-800">
                    {friend.name}
                  </span>
                </PrefetchLink>
              </li>
            ))}
          </ul>
        </RailCard>
      )}

      {recentChats.length > 0 && (
        <RailCard
          title="Recent chats"
          action={
            <Link
              href="/chat"
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              Open chat
            </Link>
          }
        >
          <ul className="space-y-1">
            {recentChats.map((chat) => (
              <li key={chat.user.id}>
                <PrefetchLink
                  href={`/chat/${chat.user.id}`}
                  prefetchUserId={chat.user.id}
                  prefetchChat
                  className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-50"
                >
                  <Avatar
                    name={chat.user.name}
                    src={chat.user.profilePicture}
                    size="md"
                    online={chat.user.isOnline}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {chat.user.name}
                    </p>
                    {chat.lastMessage && (
                      <p className="truncate text-xs text-slate-500">
                        {chat.lastMessage.content || "Attachment"}
                      </p>
                    )}
                  </div>
                </PrefetchLink>
              </li>
            ))}
          </ul>
        </RailCard>
      )}

      <RailCard title="Shortcuts">
        <ul className="space-y-1 text-sm font-medium text-slate-700">
          <li>
            <Link
              href="/feed"
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                </svg>
              </span>
              News Feed
            </Link>
          </li>
          <li>
            <Link
              href="/users"
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              Discover people
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              Your profile
            </Link>
          </li>
        </ul>
      </RailCard>
    </aside>
  );
}
