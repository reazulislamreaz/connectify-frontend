"use client";

import { useEffect, useRef, useState } from "react";
import { DesktopRightRail } from "./DesktopRightRail";

const DESKTOP_MIN = 1024;

/** Facebook-style centered feed + right rail on large screens */
export function DesktopContentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const centerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const [headerHidden, setHeaderHidden] = useState(false);

  useEffect(() => {
    const el = centerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (window.innerWidth < DESKTOP_MIN) {
        setHeaderHidden(false);
        return;
      }

      const y = el.scrollTop;
      const delta = y - lastScrollY.current;

      if (y <= 16) {
        setHeaderHidden(false);
      } else if (delta > 6) {
        setHeaderHidden(true);
      } else if (delta < -6) {
        setHeaderHidden(false);
      }

      lastScrollY.current = y;
    };

    const onResize = () => {
      if (window.innerWidth < DESKTOP_MIN) {
        setHeaderHidden(false);
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      className={`desktop-layout flex h-full min-h-0 w-full flex-col lg:flex-row ${
        headerHidden ? "header-scroll-hidden" : ""
      }`}
    >
      <div
        ref={centerRef}
        className="desktop-center scrollbar-thin flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white lg:bg-wa-panel"
      >
        <div className="mx-auto flex w-full flex-col lg:max-w-[680px] lg:py-4">
          {children}
        </div>
      </div>
      <DesktopRightRail />
    </div>
  );
}
