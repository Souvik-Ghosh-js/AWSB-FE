import type { ReactNode } from 'react';

import { Breadcrumbs, Prose, SectionHeading } from '@/components/ui';
import { SHOP } from '@/lib/shop';

/**
 * Shared shell for the four policy pages.
 *
 * These are not filler: Razorpay REQUIRES visible Terms, Privacy, Refund/
 * Cancellation and Shipping policy pages before international cards can be
 * enabled, and they must carry a real, reachable business address.
 *
 * The "last updated" date is deliberately explicit rather than `new Date()` —
 * a policy that silently claims to have been updated today, every day, is
 * worse than useless in a dispute.
 */
export const POLICY_LAST_UPDATED = '16 September 2026';

export function PolicyPage({
  title,
  eyebrow,
  intro,
  children,
}: {
  title: string;
  eyebrow: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="aw-container py-10 sm:py-14">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: title }]} />

      <div className="mt-7 max-w-3xl">
        <SectionHeading as="h1" eyebrow={eyebrow} title={title} description={intro} />

        <p className="mt-6 text-xs text-muted">Last updated: {POLICY_LAST_UPDATED}</p>

        <div className="mt-12">
          <Prose>{children}</Prose>
        </div>

        {/* Every policy page carries the real trading address, which is what
            the payment gateway's review actually checks for. */}
        <div className="mt-14 border-t border-line pt-8">
          <p className="aw-eyebrow mb-3">The seller</p>
          <address className="text-[0.875rem] leading-relaxed text-muted not-italic">
            <strong className="font-medium text-ink">{SHOP.name}</strong>
            <br />
            {SHOP.address.line1}, {SHOP.address.line2}
            <br />
            {SHOP.address.city}, {SHOP.address.state} {SHOP.address.pincode}, {SHOP.address.country}
            <br />
            <a
              href={`mailto:${SHOP.email}`}
              className="break-all underline underline-offset-4"
            >
              {SHOP.email}
            </a>
            {' · '}
            <a href={`tel:+91${SHOP.primaryPhone}`} className="underline underline-offset-4">
              +91 {SHOP.primaryPhone}
            </a>
            {', '}
            <a
              href={`tel:+91${SHOP.phones[1]}`}
              className="underline underline-offset-4"
            >
              +91 {SHOP.phones[1]}
            </a>
          </address>
        </div>
      </div>
    </div>
  );
}
