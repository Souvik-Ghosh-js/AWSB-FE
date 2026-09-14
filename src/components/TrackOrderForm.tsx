'use client';

import { useState } from 'react';

import { ApiError, trackOrder } from '@/lib/api';
import { SHOP } from '@/lib/shop';
import { isValidEmail, normaliseOrderNumber } from '@/lib/validation';
import type { Order } from '@/lib/types';
import { LineSkeleton } from './ui';
import { OrderSummaryCard } from './OrderSummaryCard';

/**
 * Guest order tracking.
 *
 * Gated on order number AND the delivery email, deliberately: order numbers
 * are sequential and guessable, so the email is what prevents one customer
 * enumerating another's address and phone number.
 */
export function TrackOrderForm() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const number = normaliseOrderNumber(orderNumber);

    if (!number) {
      setError('Enter your order number, for example AWSB-2026-00417.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter the email address you used at checkout.');
      return;
    }

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const result = await trackOrder(number, email.trim());
      if (!result) {
        // The same message whether the order is missing or the email does not
        // match — distinguishing them would confirm which order numbers exist.
        setError(
          'We could not find an order with those details. Check the order number and the email address you used at checkout.'
        );
      } else {
        setOrder(result);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.friendlyMessage
          : 'We could not look that up just now. Please try again in a moment.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="aw-card p-6 sm:p-8"
          noValidate
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="track-number" className="aw-label">
                Order number <span className="text-accent">*</span>
              </label>
              <input
                id="track-number"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="AWSB-2026-00417"
                autoComplete="off"
                className="aw-field uppercase"
              />
              <p className="aw-hint">It is in your confirmation email.</p>
            </div>

            <div>
              <label htmlFor="track-email" className="aw-label">
                Email address <span className="text-accent">*</span>
              </label>
              <input
                id="track-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="aw-field"
              />
            </div>
          </div>

          {error ? (
            <p role="alert" className="aw-error mt-4">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="aw-btn aw-btn-primary mt-6 w-full"
          >
            {loading ? 'Looking up…' : 'Track order'}
          </button>

          <p className="mt-5 text-xs leading-relaxed text-muted">
            Cannot find your order number? Email{' '}
            <a
              href={`mailto:${SHOP.email}`}
              className="break-all underline underline-offset-4"
            >
              {SHOP.email}
            </a>{' '}
            or call +91 {SHOP.primaryPhone} and we will find it for you.
          </p>
        </form>
      </div>

      {loading ? (
        <div className="mt-12 space-y-4">
          <LineSkeleton className="h-8 w-56" />
          <LineSkeleton className="h-64 w-full" />
        </div>
      ) : order ? (
        <div className="mt-14">
          <OrderSummaryCard order={order} />
        </div>
      ) : null}
    </div>
  );
}
