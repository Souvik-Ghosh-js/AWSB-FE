'use client';

import { useState } from 'react';

import { ApiError, submitReview } from '@/lib/api';
import { isPlausibleOrderNumber, isValidEmail, normaliseOrderNumber } from '@/lib/validation';

/**
 * Write a review — gated on order number + email, same proof-of-purchase the
 * backend itself checks (createReview re-verifies all of this server-side;
 * this is only so a shopper finds out they typed something wrong before
 * submitting, not the actual security boundary).
 */
export function ReviewForm({ productSlug }: { productSlug: string }) {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const number = normaliseOrderNumber(orderNumber);

    if (!isPlausibleOrderNumber(number)) {
      setError('Enter your order number, for example AWSB-2026-00417.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Enter the email address you used at checkout.');
      return;
    }
    if (rating < 1) {
      setError('Choose a star rating.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await submitReview({
        productSlug,
        orderNumber: number,
        email: email.trim(),
        rating,
        title: title.trim() || undefined,
        body: body.trim() || undefined,
        authorName: authorName.trim() || undefined,
      });
      setSuccessMessage(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage : 'We could not submit that just now.');
    } finally {
      setLoading(false);
    }
  }

  if (successMessage) {
    return (
      <div className="aw-card p-6 text-center sm:p-8">
        <p className="text-[0.9375rem] leading-relaxed text-ink">{successMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="aw-card p-6 sm:p-8" noValidate>
      <h3 className="text-xl">Write a review</h3>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">
        We verify every review against a delivered order, so it is only open to customers who
        actually bought this fragrance.
      </p>

      <div className="mt-6">
        <span className="aw-label">Your rating</span>
        <div className="mt-1.5 flex gap-1" role="radiogroup" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} star${i === 1 ? '' : 's'}`}
              onClick={() => setRating(i)}
              onMouseEnter={() => setHoverRating(i)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <svg
                viewBox="0 0 20 20"
                className={`h-7 w-7 transition-colors ${
                  i <= (hoverRating || rating) ? 'text-accent' : 'text-line-strong'
                }`}
                fill={i <= (hoverRating || rating) ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.3"
                aria-hidden="true"
              >
                <path d="m10 2 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L2.2 7.7l5.4-.8z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="rv-order" className="aw-label">
            Order number <span className="text-accent">*</span>
          </label>
          <input
            id="rv-order"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="AWSB-2026-00417"
            autoComplete="off"
            className="aw-field uppercase"
          />
        </div>
        <div>
          <label htmlFor="rv-email" className="aw-label">
            Email used at checkout <span className="text-accent">*</span>
          </label>
          <input
            id="rv-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="aw-field"
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="rv-name" className="aw-label">
          Your name (optional)
        </label>
        <input
          id="rv-name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="How it should appear on the review"
          className="aw-field"
        />
      </div>

      <div className="mt-5">
        <label htmlFor="rv-title" className="aw-label">
          Title (optional)
        </label>
        <input
          id="rv-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum it up in a few words"
          className="aw-field"
        />
      </div>

      <div className="mt-5">
        <label htmlFor="rv-body" className="aw-label">
          Your review (optional)
        </label>
        <textarea
          id="rv-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="How it smells, how it wears, whether you would buy it again."
          className="aw-field"
        />
      </div>

      {error ? (
        <p role="alert" className="aw-error mt-4">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={loading} className="aw-btn aw-btn-primary mt-6 w-full">
        {loading ? 'Submitting…' : 'Submit review'}
      </button>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Your review is checked against your order before it goes live, and is published once a
        human has read it.
      </p>
    </form>
  );
}
