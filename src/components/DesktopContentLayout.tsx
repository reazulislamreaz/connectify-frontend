"use client";

import { DesktopRightRail } from "./DesktopRightRail";

/** Facebook-style centered feed + right rail on large screens */
export function DesktopContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="desktop-layout flex h-full min-h-0 w-full flex-col lg:flex-row">
      <div className="desktop-center scrollbar-thin flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white lg:bg-wa-panel">
        <div className="mx-auto flex w-full flex-col lg:max-w-[680px] lg:py-4">
          {children}
        </div>
      </div>
      <DesktopRightRail />
    </div>
  );
}
