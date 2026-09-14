/**
 * Shared presentational primitives.
 *
 * Every page needs empty, loading and error states because the API is a
 * separate service that can be slow or down — so those states are components
 * here rather than ad-hoc markup repeated in a dozen files.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

/* ---------------------------------------------------------- section head */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  as: Tag = 'h2',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  as?: 'h1' | 'h2' | 'h3';
}) {
  const centered = align === 'center';
  return (
    <div className={centered ? 'text-center' : ''}>
      {eyebrow ? <p className="aw-eyebrow aw-eyebrow-accent mb-3">{eyebrow}</p> : null}
      <Tag
        className={
          Tag === 'h1'
            ? 'text-3xl sm:text-4xl lg:text-5xl'
            : 'text-2xl sm:text-3xl'
        }
      >
        {title}
      </Tag>
      {centered ? (
        <hr className="aw-rule-center mt-5" />
      ) : (
        <hr className="aw-rule mt-5 max-w-[14rem]" />
      )}
      {description ? (
        <p
          className={`mt-5 text-lg leading-relaxed text-soft ${
            centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'
          }`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- feedback */

/**
 * Something went wrong fetching from the API. Deliberately calm and specific:
 * a shopper needs to know whether to retry or give up, not see a stack trace.
 */
export function ErrorState({
  title = 'We could not load this just now',
  message,
  retryHref,
  compact = false,
}: {
  title?: string;
  message?: string;
  retryHref?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="alert"
      className={`aw-card flex flex-col items-center text-center ${
        compact ? 'px-5 py-8' : 'px-6 py-14 sm:py-20'
      }`}
    >
      <span
        aria-hidden="true"
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-line-strong text-lg text-accent"
      >
        !
      </span>
      <h3 className="text-xl sm:text-2xl">{title}</h3>
      <p className="mt-3 max-w-md text-base text-soft">
        {message ??
          'The shop is having trouble reaching its catalogue. This is usually brief — please try again in a moment.'}
      </p>
      {retryHref ? (
        <Link href={retryHref} className="aw-btn aw-btn-outline aw-btn-sm mt-6">
          Try again
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
  compact = false,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`aw-card flex flex-col items-center text-center ${
        compact ? 'px-5 py-10' : 'px-6 py-16 sm:py-24'
      }`}
    >
      {/* Was a "❧" character, which fell back to a system glyph and read as
          stray punctuation rather than an ornament. Drawn instead. */}
      <svg
        viewBox="0 0 48 24"
        aria-hidden="true"
        className="mb-5 h-4 w-20 text-accent"
        fill="none"
      >
        <path d="M2 12h13M33 12h13" stroke="currentColor" strokeWidth="1" opacity="0.45" />
        <path
          d="M24 5.5c2.6 0 4.4 1.9 4.4 4.1 0 3-3 5.3-4.4 8.9-1.4-3.6-4.4-5.9-4.4-8.9 0-2.2 1.8-4.1 4.4-4.1z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>
      <h3 className="text-xl sm:text-2xl">{title}</h3>
      {message ? <p className="mt-3 max-w-md text-base text-soft">{message}</p> : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------- skeletons */

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <div className="aw-skeleton aspect-[4/5] w-full rounded-sm" />
      <div className="aw-skeleton mt-4 h-3 w-20 rounded-sm" />
      <div className="aw-skeleton mt-3 h-5 w-3/4 rounded-sm" />
      <div className="aw-skeleton mt-2.5 h-3 w-1/2 rounded-sm" />
      <div className="aw-skeleton mt-4 h-4 w-24 rounded-sm" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-7 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function LineSkeleton({ className = '' }: { className?: string }) {
  return <div className={`aw-skeleton rounded-sm ${className}`} />;
}

/* ---------------------------------------------------------------- badges */

export function StockBadge({
  inStock,
  isLowStock = false,
}: {
  inStock: boolean;
  isLowStock?: boolean;
}) {
  if (!inStock) {
    return (
      <span className="aw-badge bg-surface-alt text-muted">
        <Dot className="bg-muted" />
        Sold out
      </span>
    );
  }
  if (isLowStock) {
    return (
      <span className="aw-badge bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] text-[#8a6c26]">
        <Dot className="bg-accent" />
        Only a few left
      </span>
    );
  }
  return (
    <span className="aw-badge bg-[color-mix(in_srgb,var(--color-brand-soft)_12%,transparent)] text-brand-soft">
      <Dot className="bg-brand-soft" />
      In stock
    </span>
  );
}

function Dot({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${className}`} />;
}

/** Colour-coded order status pill, shared by the storefront and the admin. */
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_payment: 'bg-surface-alt text-muted',
    confirmed: 'bg-[color-mix(in_srgb,var(--color-brand-soft)_14%,transparent)] text-brand',
    packed: 'bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-[#8a6c26]',
    shipped: 'bg-[color-mix(in_srgb,var(--color-brand-soft)_18%,transparent)] text-brand-soft',
    delivered: 'bg-[color-mix(in_srgb,var(--color-brand)_14%,transparent)] text-brand',
    cancelled: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-danger',
    refunded: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-danger',
    paid: 'bg-[color-mix(in_srgb,var(--color-brand-soft)_14%,transparent)] text-brand-soft',
    pending: 'bg-surface-alt text-muted',
    failed: 'bg-[color-mix(in_srgb,var(--color-danger)_10%,transparent)] text-danger',
  };

  const label: Record<string, string> = {
    pending_payment: 'Awaiting payment',
    confirmed: 'Confirmed',
    packed: 'Packed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
    partially_refunded: 'Part refunded',
  };

  return (
    <span className={`aw-badge ${styles[status] ?? 'bg-surface-alt text-muted'}`}>
      {label[status] ?? status}
    </span>
  );
}

/* ----------------------------------------------------------------- stars */

export function Stars({
  rating,
  count,
  size = 'sm',
}: {
  rating: number | null;
  count?: number;
  size?: 'sm' | 'md';
}) {
  if (rating == null) {
    return <span className="text-xs text-soft">No reviews yet</span>;
  }

  const dim = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`Rated ${rating} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <svg key={i} viewBox="0 0 20 20" className={dim} aria-hidden="true">
            <defs>
              <linearGradient id={`star-${i}-${Math.round(rating * 10)}`}>
                <stop offset={`${Math.max(0, Math.min(1, rating - i + 1)) * 100}%`} stopColor="var(--color-accent)" />
                <stop offset={`${Math.max(0, Math.min(1, rating - i + 1)) * 100}%`} stopColor="var(--color-line-strong)" />
              </linearGradient>
            </defs>
            <path
              d="M10 1.6l2.47 5.18 5.53.76-4.03 3.86.99 5.6L10 14.28 5.04 17l.99-5.6L2 7.54l5.53-.76z"
              fill={`url(#star-${i}-${Math.round(rating * 10)})`}
            />
          </svg>
        ))}
      </span>
      {count != null ? (
        <span className="text-xs font-medium text-soft">
          {rating.toFixed(1)} ({count})
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------ misc bits */

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="[&_a]:text-brand-soft [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:text-lg [&_li]:mb-2 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_p]:text-[0.9375rem] [&_p]:leading-[1.75] [&_strong]:font-medium [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}

export function Breadcrumbs({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  return (
    <nav aria-label="Breadcrumb" className="text-xs text-soft">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-brand">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
            {i < items.length - 1 ? (
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Decorative divider between page sections.
 *
 * Was a "❦" text character, which has no glyph in either webfont and fell
 * back to whatever the system had — it rendered as a speck of punctuation.
 * Drawn as SVG so it is the same mark on every machine.
 */
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 160 20" className="h-5 w-40 text-accent" fill="none">
        <path d="M4 10h54M102 10h54" stroke="currentColor" strokeWidth="1" opacity="0.4" />
        <path
          d="M80 3.5c3.1 0 5.2 2.2 5.2 4.9 0 3.5-3.6 6.2-5.2 10.1-1.6-3.9-5.2-6.6-5.2-10.1 0-2.7 2.1-4.9 5.2-4.9z"
          stroke="currentColor"
          strokeWidth="1.2"
        />
        <circle cx="66" cy="10" r="1.4" fill="currentColor" opacity="0.7" />
        <circle cx="94" cy="10" r="1.4" fill="currentColor" opacity="0.7" />
      </svg>
    </div>
  );
}
