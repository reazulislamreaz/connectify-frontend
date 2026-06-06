import type { CallLogStatus, CallType } from "@/types";

export function formatCallDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (s === 0) return `${m} min`;
  return `${m} min ${s} sec`;
}

export function getCallLogLabel(
  callStatus: CallLogStatus,
  isCaller: boolean,
  durationSeconds = 0,
  callType: CallType = "audio",
): string {
  const kind = callType === "video" ? "video call" : "voice call";
  const Kind = callType === "video" ? "Video call" : "Voice call";
  const Missed = callType === "video" ? "Missed video call" : "Missed voice call";

  switch (callStatus) {
    case "completed":
      return isCaller
        ? `Outgoing ${kind} · ${formatCallDuration(durationSeconds)}`
        : `Incoming ${kind} · ${formatCallDuration(durationSeconds)}`;
    case "disconnected":
      return `${Kind} ended · ${formatCallDuration(durationSeconds)}`;
    case "rejected":
      return `${Kind} · Declined`;
    case "cancelled":
      return isCaller ? `${Kind} · Cancelled` : Missed;
    case "missed":
      return isCaller ? `${Kind} · No answer` : Missed;
    case "busy":
      return `${Kind} · Busy`;
    default:
      return Kind;
  }
}
