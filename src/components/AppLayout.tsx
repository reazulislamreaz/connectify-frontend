"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatDetail =
    pathname.startsWith("/chat/") && pathname !== "/chat";

  return (
    <ProtectedRoute>
      <div className="flex h-[100dvh] bg-wa-panel md:bg-slate-100">
        <Sidebar />
        <main
          className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:pb-0 ${
            isChatDetail ? "pb-0" : "pb-[4.25rem]"
          }`}
        >
          <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white md:shadow-soft">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
