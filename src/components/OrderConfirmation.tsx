'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ApiError, trackOrder } from '@/lib/api';
import { formatDate, formatPhone } from '@/lib/format';
import { SHOP } from '@/lib/shop';
import { isValidEmail } from '@/lib/validation';
import type { Order } from '@/lib/types';
import { LineSkeleton, Ornament, StatusBadge } from './ui';
import { OrderSummaryCard } from './OrderSummaryCard';

/**
 * Confirmation / order status.
 *
 * The lookup is gated on order number + email, because order numbers are
 * sequential ('AWSB-2026-00417') and therefore guessable. Requiring the
 * matching email is what stops one customer reading another's address and
 * phone number.
 *
 * Immediately after payment the email is not asked for twice: the shopper just
 * typed it at checkout, so it is read from a short-lived handoff in
 * sessionStorage if present. Otherwise they confirm it here.
 */
export function OrderConfirmation({
  orderNumber,
  justPaid,
  pendingConfirmation,
}: {
  orderNumber: string;
  justPaid: boolean;
  pendingConfirmation: boolean;
}) {
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const lookup = useCallback(
    async (lookupEmail: string) => {
      if (!isValidEmail(lookupEmail)) {
        setError('Please enter the email address you used at checkout.');
        return;
      }

      setLoading(true);
      setError(null);
      setAttempted(true);

      try {
        const result = await trackOrder(orderNumber, { email: lookupEmail });
        if (!result) {
          setError(
            'We could not find that order. Please check the order number and the email address you used.'
          );
          setOrder(null);
        } else {
          setOrder(result);
        }
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.friendlyMessage
            : 'We could not load your order just now.'
        );
      } finally {
        setLoading(false);
      }
    },
    [orderNumber]
  );

  // Try the email the shopper just used at checkout, so the common path shows
  // the order without asking anything.
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.sessionStorage.getItem('awsb.checkout.email');
    } catch {
      // Blocked storage — fall through to asking for the email.
    }
    if (stored && isValidEmail(stored)) {
      setEmail(stored);
      void lookup(stored);
    }
  }, [lookup]);

  return (
    <div>
      {/* ------------------------------------------------- the thank-you */}
      {justPaid || pendingConfirmation ? (
        <div className="text-center">
          <span
            aria-hidden="true"
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-accent text-xl text-accent"
          >
            ✓
          </span>
          <h1 className="mt-6 text-[2rem] leading-tight sm:text-[2.75rem]">
            Thank you — your order is placed
          </h1>
          <Ornament className="mt-6" />
          <p className="mx-auto mt-6 max-w-lg text-[0.9375rem] leading-relaxed text-muted">
            Your order number is{' '}
            <strong className="font-medium text-ink">{orderNumber}</strong>. A
            confirmation is on its way to your inbox, and we will email the tracking
            details as soon as your parcel leaves us.
          </p>

          {pendingConfirmation ? (
            <p className="mx-auto mt-5 max-w-lg border border-line-strong bg-surface-alt px-5 py-4 text-[0.8125rem] leading-relaxed text-muted">
              Your payment went through. We are still finalising the confirmation on our
              side — this takes a moment and completes on its own. Nothing further is
              needed from you.
            </p>
          ) : null}
        </div>
      ) : (
        <div>
          <h1 className="text-[2rem] leading-tight sm:text-[2.5rem]">
            Order {orderNumber}
          </h1>
          <hr className="aw-rule mt-5 max-w-[14rem]" />
        </div>
      )}

      {/* ------------------------------------------------ email gate / body */}
      <div className="mt-12">
        {loading ? (
          <div className="space-y-4">
            <LineSkeleton className="h-6 w-48" />
            <LineSkeleton className="h-40 w-full" />
          </div>
        ) : order ? (
          <OrderSummaryCard order={order} />
        ) : (
          <div className="mx-auto max-w-md">
            <div className="aw-card p-6 sm:p-8">
              <h2 className="text-xl">View your order</h2>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
                For your security, confirm the email address used when placing this
                order.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void lookup(email);
                }}
                className="mt-6"
                noValidate
              >
                <label htmlFor="order-email" className="aw-label">
                  Email address
                </label>
                <input
                  id="order-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`aw-field ${error && attempted ? 'aw-field-error' : ''}`}
                  aria-describedby={error ? 'order-email-error' : undefined}
                />
                {error ? (
                  <p id="order-email-error" className="aw-error" role="alert">
                    {error}
                  </p>
                ) : null}

                <button type="submit" className="aw-btn aw-btn-primary mt-5 w-full">
                  View order
                </button>
              </form>

              <p className="mt-5 text-xs leading-relaxed text-muted">
                Having trouble? Write to us at{' '}
                <a
                  href={`mailto:${SHOP.email}`}
                  className="break-all underline underline-offset-4"
                >
                  {SHOP.email}
                </a>{' '}
                quoting {orderNumber}.
              </p>
            </div>
          </div>
        )}
      </div>

      {order ? (
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-line pt-10 sm:flex-row sm:justify-between">
          <p className="text-[0.8125rem] text-muted">
            {order.placedAt ? `Placed ${formatDate(order.placedAt)} · ` : null}
            <StatusBadge status={order.status} />
          </p>
          <div className="flex gap-3">
            <Link href="/shop" className="aw-btn aw-btn-outline aw-btn-sm">
              Continue shopping
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Small helper reused by the tracking page for the contact line. */
export function SupportLine({ orderNumber }: { orderNumber?: string }) {
  return (
    <p className="text-xs leading-relaxed text-muted">
      Questions about this order? Call{' '}
      <a href={`tel:+91${SHOP.primaryPhone}`} className="underline underline-offset-4">
        +91 {formatPhone(SHOP.primaryPhone)}
      </a>{' '}
      or email{' '}
      <a href={`mailto:${SHOP.email}`} className="break-all underline underline-offset-4">
        {SHOP.email}
      </a>
      {orderNumber ? `, quoting ${orderNumber}` : null}.
    </p>
  );
}

