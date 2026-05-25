"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";
import { DesktopContentLayout } from "./DesktopContentLayout";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatDetail =
    pathname.startsWith("/chat/") && pathname !== "/chat";
  const isChatRoute = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] bg-wa-panel md:bg-slate-100">
        <Sidebar />
        <main
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-0 ${
            isChatDetail ? "pb-0" : "pb-[4.25rem]"
          }`}
        >
          {isChatRoute ? (
            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white">
              {children}
            </div>
          ) : (
            <DesktopContentLayout>{children}</DesktopContentLayout>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
