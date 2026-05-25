import { QueryClient } from "@tanstack/react-query";
import { isAbortError, isRetryableApiError } from "@/lib/apiErrors";

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (isAbortError(error)) return false;
  if (isRetryableApiError(error)) return failureCount < 2;
  return failureCount < 1;
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 2 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: shouldRetryQuery,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") {
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
