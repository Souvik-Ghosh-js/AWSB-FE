import Link from 'next/link';

import { Ornament } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="aw-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="aw-eyebrow aw-eyebrow-accent">Error 404</p>
      <h1 className="mt-5 text-[2.25rem] sm:text-[3rem]">This page has evaporated</h1>
      <Ornament className="mt-7" />
      <p className="mt-7 max-w-md text-[0.9375rem] leading-relaxed text-muted">
        The page you were looking for is not here. It may have been moved, or the
        fragrance may no longer be in the collection.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="aw-btn aw-btn-primary">
          Browse the collection
        </Link>
        <Link href="/" className="aw-btn aw-btn-outline">
          Return home
        </Link>
      </div>
    </div>
  );
}
