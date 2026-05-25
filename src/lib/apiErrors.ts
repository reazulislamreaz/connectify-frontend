/** Request was cancelled (e.g. search query key changed) — do not toast */
export function isAbortError(err: unknown): boolean {
  return (
    err instanceof DOMException && err.name === "AbortError"
  ) || (
    err instanceof Error &&
    (err.name === "AbortError" || /aborted/i.test(err.message))
  );
}

/** Transient failures that are worth retrying */
export function isRetryableApiError(err: unknown): boolean {
  if (isAbortError(err)) return false;
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("cannot reach") ||
    msg.includes("timed out") ||
    msg.includes("network error") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed")
  );
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  if (isAbortError(err)) return "";
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
