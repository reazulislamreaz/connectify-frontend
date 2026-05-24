import { io, Socket } from "socket.io-client";
import { getToken } from "./api";

let socket: Socket | null = null;

function getDirectSocketConfig(): { url: string; path: string } {
  const raw =
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8081" : "");
  if (!raw) {
    throw new Error("NEXT_PUBLIC_SOCKET_URL is not set");
  }

  const parsed = new URL(raw);
  const explicitPath = process.env.NEXT_PUBLIC_SOCKET_PATH?.trim();

  if (explicitPath) {
    return {
      url: parsed.origin,
      path: explicitPath.replace(/\/$/, ""),
    };
  }

  const pathname = parsed.pathname.replace(/\/$/, "");
  if (pathname && pathname !== "/") {
    const path = pathname.endsWith("socket.io")
      ? pathname
      : `${pathname}/socket.io`;
    return { url: parsed.origin, path };
  }

  return { url: parsed.origin, path: "/socket.io" };
}

function resolveSocketOrigin(directOrigin: string): string {
  const secureRaw = process.env.NEXT_PUBLIC_SOCKET_SECURE_URL?.trim();
  if (secureRaw) {
    return new URL(secureRaw).origin;
  }

  const direct = new URL(directOrigin);
  if (direct.protocol === "https:") {
    return direct.origin;
  }

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    console.error(
      "[socket] HTTPS frontend cannot use an HTTP socket server. " +
        "Set NEXT_PUBLIC_SOCKET_SECURE_URL to your WSS origin " +
        "(e.g. a Cloudflare-proxied domain in front of the VPS).",
    );
  }

  return direct.origin;
}

function getSocketConfig(): { url: string; path: string } {
  const direct = getDirectSocketConfig();

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return { url: resolveSocketOrigin(direct.url), path: direct.path };
  }

  return direct;
}

export function getSocket(): Socket {
  if (!socket) {
    const { url, path } = getSocketConfig();
    socket = io(url, {
      path,
      autoConnect: false,
      auth: { token: getToken() },
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelayMax: 10_000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const token = getToken();
  if (!token) {
    return getSocket();
  }

  const s = getSocket();
  s.auth = { token };

  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
