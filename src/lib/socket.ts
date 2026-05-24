import { io, Socket } from "socket.io-client";
import { getToken } from "./api";
import { resolveSocketClientConfig } from "./socketConfig";

let socket: Socket | null = null;
let socketKey: string | null = null;

function socketTransports(): ("websocket" | "polling")[] {
  // WebSocket-only in production avoids nginx multi-instance polling issues.
  return process.env.NODE_ENV === "production"
    ? ["websocket"]
    : ["websocket", "polling"];
}

function configKey(config: { url: string; path: string }): string {
  return `${config.url}|${config.path}`;
}

export function getSocket(): Socket {
  const config = resolveSocketClientConfig();
  const key = configKey(config);

  if (socket && socketKey !== key) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    socketKey = null;
  }

  if (!socket) {
    socketKey = key;
    socket = io(config.url, {
      path: config.path,
      autoConnect: false,
      auth: { token: getToken() },
      transports: socketTransports(),
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
      timeout: 20_000,
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
    socketKey = null;
  }
}
