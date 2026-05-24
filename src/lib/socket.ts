import { io, Socket } from "socket.io-client";
import { getToken } from "./api";

let socket: Socket | null = null;

function getSocketConfig(): { url: string; path: string } {
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

export function getSocket(): Socket {
  if (!socket) {
    const { url, path } = getSocketConfig();
    socket = io(url, {
      path,
      autoConnect: false,
      auth: { token: getToken() },
      // WebSocket avoids "Session ID unknown" with nginx + multiple backend instances.
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelayMax: 10_000,
    });
  }
  return socket;
}

export function connectSocket(): Socket {
  const s = getSocket();
  s.auth = { token: getToken() };
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
