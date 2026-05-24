/**
 * Resolves Socket.IO client URL/path for local dev vs HTTPS production (Vercel).
 *
 * Production (Vercel): NEXT_PUBLIC_SOCKET_URL must be https/wss-capable, or set
 * NEXT_PUBLIC_SOCKET_SECURE_URL to a Cloudflare/SSL domain in front of the VPS.
 */
export type SocketClientConfig = {
  url: string;
  path: string;
  secure: boolean;
};

function parsePath(raw: string, explicitPath?: string): string {
  if (explicitPath) {
    return explicitPath.replace(/\/$/, "") || "/socket.io";
  }
  const parsed = new URL(raw);
  const pathname = parsed.pathname.replace(/\/$/, "");
  if (pathname && pathname !== "/") {
    return pathname.endsWith("socket.io") ? pathname : `${pathname}/socket.io`;
  }
  return "/socket.io";
}

export function resolveSocketClientConfig(): SocketClientConfig {
  const raw =
    process.env.NEXT_PUBLIC_SOCKET_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? "http://localhost:8081" : "");

  if (!raw) {
    throw new Error("NEXT_PUBLIC_SOCKET_URL is not set");
  }

  const path = parsePath(
    raw,
    process.env.NEXT_PUBLIC_SOCKET_PATH?.trim(),
  );

  const secureOverride = process.env.NEXT_PUBLIC_SOCKET_SECURE_URL?.trim();
  const onHttpsPage =
    typeof window !== "undefined" && window.location.protocol === "https:";

  if (secureOverride) {
    const origin = new URL(secureOverride).origin;
    return { url: origin, path, secure: origin.startsWith("https:") };
  }

  const parsed = new URL(raw);
  const origin = parsed.origin;
  const isSecure = parsed.protocol === "https:";

  if (onHttpsPage && !isSecure) {
    throw new Error(
      "Socket misconfigured for HTTPS: set NEXT_PUBLIC_SOCKET_URL to an https:// origin " +
        "or set NEXT_PUBLIC_SOCKET_SECURE_URL (e.g. Cloudflare-proxied domain → VPS). " +
        "HTTP WebSockets are blocked on https:// pages.",
    );
  }

  return { url: origin, path, secure: isSecure };
}

export function isVercelProduction(): boolean {
  return (
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ||
    process.env.VERCEL === "1"
  );
}
