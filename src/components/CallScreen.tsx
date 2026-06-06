"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCall } from "@/context/CallContext";
import { Avatar } from "@/components/Avatar";

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${mm}:${ss}`;
}

function PhoneIcon({ className }: { className?: string }) {
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

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function VideoOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25v-9c0-.621.252-1.183.659-1.591M3 3l18 18" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}

function MicOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A23.902 23.902 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75 2.034 0 3.923.627 5.482 1.698m0 0L21.75 4.5M17.25 9.75L21.75 4.5" />
    </svg>
  );
}

/** Round control button used in the call action bar. */
function ControlButton({
  onClick,
  label,
  active,
  className,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-14 w-14 items-center justify-center rounded-full backdrop-blur transition active:scale-95 ${
        className ??
        (active
          ? "bg-white text-slate-900"
          : "bg-white/15 text-white hover:bg-white/25")
      }`}
    >
      {children}
    </button>
  );
}

export function CallScreen() {
  const {
    phase,
    callType,
    activeCall,
    peerName,
    peerAvatar,
    muted,
    cameraOff,
    remoteStream,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMute,
    toggleCamera,
    attachLocalVideo,
  } = useCall();

  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localViewRef = useRef<HTMLDivElement | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVideo = callType === "video";
  const isCaller = activeCall?.isCaller ?? false;
  const visible = phase !== "idle";

  // Call timer — counts up once connected.
  useEffect(() => {
    if (phase !== "active") {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Attach the remote MediaStream to the on-screen <video> for video calls.
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el) return;
    if (remoteStream) {
      el.srcObject = remoteStream;
      void el.play().catch(() => {
        /* autoplay may need a tap */
      });
    } else {
      el.srcObject = null;
    }
  }, [remoteStream, phase]);

  // Mount the local camera preview into its container while in a video call.
  // Depends on `phase` too: the container element swaps from a full-screen
  // preview (connecting) to a corner PiP (active), so we must re-attach.
  const showLocalPreview =
    isVideo && (phase === "connecting" || phase === "active");
  useEffect(() => {
    if (showLocalPreview && localViewRef.current) {
      attachLocalVideo(localViewRef.current);
    }
    return () => {
      attachLocalVideo(null);
    };
  }, [showLocalPreview, phase, attachLocalVideo]);

  // Auto-hide controls during an active video call.
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (isVideo && phase === "active") {
      hideTimerRef.current = setTimeout(() => setControlsVisible(false), 5000);
    }
  }, [isVideo, phase]);

  useEffect(() => {
    revealControls();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [revealControls]);

  if (!visible) return null;

  const statusLabel =
    phase === "outgoing"
      ? "Ringing…"
      : phase === "incoming"
        ? isVideo
          ? "Incoming video call"
          : "Incoming voice call"
        : phase === "connecting"
          ? "Connecting…"
          : phase === "active"
            ? formatDuration(elapsed)
            : "Ending…";

  const showRemoteVideo = isVideo && phase === "active" && Boolean(remoteStream);
  // While connecting a video call, show the user's own camera full-screen.
  const showLocalFullscreen = isVideo && phase === "connecting";
  const showAvatar = !showRemoteVideo && !showLocalFullscreen;
  const onScreenTap = () => {
    if (isVideo && phase === "active") {
      setControlsVisible((v) => !v);
      if (!controlsVisible) revealControls();
    }
  };

  const hangUp = isCaller && phase === "outgoing" ? cancelCall : endCall;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden text-white select-none animate-fade-in"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      onClick={onScreenTap}
    >
      {/* Background: remote video for active video calls, otherwise a brand gradient */}
      {showRemoteVideo ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 h-full w-full bg-black object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-brand-700 via-brand-800 to-brand-950" />
      )}

      {/* Connecting-state local preview fills the screen behind a dim layer */}
      {showLocalFullscreen && (
        <>
          <div
            ref={localViewRef}
            className="absolute inset-0 h-full w-full bg-black [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </>
      )}

      {/* Readability scrims over video */}
      {showRemoteVideo && (
        <>
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/70 to-transparent" />
        </>
      )}

      {/* Local camera picture-in-picture during an active video call */}
      {isVideo && phase === "active" && (
        <div
          ref={localViewRef}
          className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 h-40 w-28 overflow-hidden rounded-2xl border border-white/20 bg-black shadow-xl [&>video]:h-full [&>video]:w-full [&>video]:object-cover sm:h-48 sm:w-36"
        >
          {cameraOff && (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white/70">
              <VideoOffIcon className="h-7 w-7" />
            </div>
          )}
        </div>
      )}

      {/* Header: peer identity + status */}
      <div className="relative z-10 px-6 pt-8 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-white/70">
          {isVideo ? "Video call" : "Voice call"}
        </p>
        <h1 className="mt-1 truncate text-3xl font-semibold">{peerName}</h1>
        <p className="mt-2 text-base text-white/80">{statusLabel}</p>
      </div>

      {/* Centerpiece avatar — shown for voice calls and pre-connect states */}
      {showAvatar ? (
        <div className="relative z-10 flex flex-1 items-center justify-center">
          <div className="relative">
            {(phase === "outgoing" || phase === "incoming") && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
                <span className="absolute -inset-3 animate-pulse rounded-full bg-white/10" />
              </>
            )}
            <div className="relative rounded-full ring-4 ring-white/20">
              <Avatar name={peerName} src={peerAvatar} size="xl" />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex-1" />
      )}

      {/* Action controls */}
      <div
        className={`relative z-30 px-8 pb-10 pt-4 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "incoming" ? (
          <div className="mx-auto flex max-w-sm items-center justify-around">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={rejectCall}
                aria-label="Decline"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition hover:bg-rose-700 active:scale-95"
              >
                <PhoneIcon className="h-7 w-7 rotate-[135deg]" />
              </button>
              <span className="text-sm text-white/80">Decline</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={acceptCall}
                aria-label="Accept"
                className="flex h-16 w-16 animate-bounce items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600 active:scale-95"
              >
                {isVideo ? (
                  <VideoIcon className="h-7 w-7" />
                ) : (
                  <PhoneIcon className="h-7 w-7" />
                )}
              </button>
              <span className="text-sm text-white/80">Accept</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-sm items-center justify-center gap-5">
            <ControlButton
              onClick={toggleMute}
              label={muted ? "Unmute" : "Mute"}
              active={muted}
            >
              {muted ? (
                <MicOffIcon className="h-6 w-6" />
              ) : (
                <MicIcon className="h-6 w-6" />
              )}
            </ControlButton>

            {isVideo && (
              <ControlButton
                onClick={toggleCamera}
                label={cameraOff ? "Turn camera on" : "Turn camera off"}
                active={cameraOff}
              >
                {cameraOff ? (
                  <VideoOffIcon className="h-6 w-6" />
                ) : (
                  <VideoIcon className="h-6 w-6" />
                )}
              </ControlButton>
            )}

            <button
              type="button"
              onClick={hangUp}
              aria-label="End call"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg transition hover:bg-rose-700 active:scale-95"
            >
              <PhoneIcon className="h-7 w-7 rotate-[135deg]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
