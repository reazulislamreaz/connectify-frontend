import Link from "next/link";

/** Custom 404 shown for unmatched routes. */
export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-wa-panel px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="space-y-1.5">
        <p className="text-3xl font-bold text-slate-900">404</p>
        <h1 className="text-lg font-semibold text-slate-800">Page not found</h1>
        <p className="max-w-sm text-sm text-slate-500">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
      </div>
      <Link href="/" className="btn-primary">
        Back home
      </Link>
    </div>
  );
}
