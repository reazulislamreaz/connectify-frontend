"use client";

import { getCallLogLabel } from "@/lib/callLabel";
import type { CallLogStatus, CallType } from "@/types";

interface CallLogBubbleProps {
  callStatus: CallLogStatus;
  callDuration: number;
  isCaller: boolean;
  createdAt: string;
  callType?: CallType;
}

function CallIcon({ missed, video }: { missed: boolean; video: boolean }) {
  const className = `h-4 w-4 shrink-0 ${missed ? "text-rose-500" : "text-brand-600"}`;
  if (video) {
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}

export function CallLogBubble({
  callStatus,
  callDuration,
  isCaller,
  createdAt,
  callType = "audio",
}: CallLogBubbleProps) {
  const label = getCallLogLabel(callStatus, isCaller, callDuration, callType);
  const isMissed =
    callStatus === "missed" ||
    callStatus === "rejected" ||
    callStatus === "cancelled" ||
    callStatus === "busy";
  const time = new Date(createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex justify-center py-1">
      <div
        className={`flex max-w-[90%] items-center gap-2 rounded-full px-4 py-2 text-xs shadow-sm ${
          isMissed
            ? "bg-rose-50 text-rose-800 ring-1 ring-rose-100"
            : "bg-white/90 text-slate-600 ring-1 ring-slate-200/80"
        }`}
      >
        <CallIcon missed={isMissed} video={callType === "video"} />
        <span className="font-medium">{label}</span>
        <span className="text-slate-400">·</span>
        <span className="text-slate-400">{time}</span>
      </div>
    </div>
  );
}
