'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Ornament } from '@/components/ui';

/**
 * Route-level error boundary.
 *
 * The shopper never sees the exception text — an API stack trace or a
 * connection string in the UI would be both confusing and a disclosure risk.
 * The digest is shown instead, which is what support would need to find it in
 * the server logs.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console for development; in production this is
    // where a Sentry/LogRocket call would go.
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="aw-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="aw-eyebrow aw-eyebrow-accent">Something went wrong</p>
      <h1 className="mt-5 text-[2rem] sm:text-[2.75rem]">We could not load this page</h1>
      <Ornament className="mt-7" />
      <p className="mt-7 max-w-md text-[0.9375rem] leading-relaxed text-muted">
        This is usually temporary. Please try again — if it keeps happening, write to us
        and we will sort it out.
      </p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="aw-btn aw-btn-primary">
          Try again
        </button>
        <Link href="/" className="aw-btn aw-btn-outline">
          Return home
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-8 text-xs text-muted">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
