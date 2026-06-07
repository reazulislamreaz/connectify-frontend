function getApiBaseUrl(): string {
  const url = (process.env.NEXT_PUBLIC_API_URL || "/api").trim();
  if (url.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url}`;
    }
    return url;
  }
  return url.replace(/\/$/, "");
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

/**
 * Read the `role` claim from the JWT (UI gating only — the server still enforces
 * authorization). Survives reloads since the token lives in localStorage, so the
 * admin nav doesn't depend on the (cacheable) /auth/me response.
 */
export function getTokenRole(): string | undefined {
  const token = getToken();
  if (!token) return undefined;
  try {
    const part = token.split(".")[1];
    if (!part) return undefined;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
    const claims = JSON.parse(atob(b64 + pad)) as { role?: unknown };
    return typeof claims.role === "string" ? claims.role : undefined;
  } catch {
    return undefined;
  }
}

export function getUploadUrl(path?: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base =
    process.env.NEXT_PUBLIC_UPLOADS_URL || "https://reaz8080.syedbipul.me";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 25_000;

export async function api<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    auth = true,
    headers: customHeaders,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal: externalSignal,
    ...rest
  } = options;

  const headers: HeadersInit = {
    ...(rest.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...customHeaders,
  };

  if (auth) {
    const token = getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...rest,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      if (externalSignal?.aborted) {
        throw err;
      }
      throw new Error(
        process.env.NODE_ENV === "development"
          ? "Cannot reach API: Request timed out"
          : "Request timed out. The server may be slow — try again.",
      );
    }
    const detail =
      err instanceof Error ? err.message : "Network error";
    throw new Error(
      process.env.NODE_ENV === "development"
        ? `Cannot reach API: ${detail}`
        : "Cannot reach the API server. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }

  let data: { message?: string; success?: boolean };
  try {
    data = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "Invalid response from server"
        : `Server error (${response.status}). Check BACKEND_PROXY_URL in .env.local — the API path may be wrong.`,
    );
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}
