'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { formatDate } from '@/lib/format';
import type { Review } from '@/lib/types';
import { Stars } from './ui';
import { ReviewForm } from './ReviewForm';

/**
 * Client island so the "Write a review" toggle has somewhere to hold state —
 * the product page itself is a server component. Renders the same read-only
 * list as before, plus the form that was previously missing entirely (see
 * ReviewForm.tsx): nothing on the storefront ever called submitReview, so no
 * customer could actually leave a review no matter how they got here.
 */
export function ReviewsSection({
  productName,
  productSlug,
  ratingAvg,
  ratingCount,
  reviews,
}: {
  productName: string;
  productSlug: string;
  ratingAvg: number | null;
  ratingCount: number;
  reviews: Review[];
}) {
  // ?review=1 arrives from the "delivered" email's review links, so the form
  // is already open when the shopper lands rather than making them hunt for
  // the button.
  const openFromEmail = useSearchParams().get('review') === '1';
  const [showForm, setShowForm] = useState(openFromEmail);

  return (
    <section id="reviews" className="mt-16 scroll-mt-24 sm:mt-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[1.625rem] sm:text-[2rem]">What customers say</h2>
          <hr className="aw-rule mt-5 max-w-[12rem]" />
        </div>
        <div className="flex items-center gap-4">
          {ratingCount > 0 ? <Stars rating={ratingAvg} count={ratingCount} size="md" /> : null}
          {!showForm ? (
            <button type="button" onClick={() => setShowForm(true)} className="aw-btn aw-btn-outline aw-btn-sm">
              Write a review
            </button>
          ) : null}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-8 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          No reviews yet for {productName}. Be the first to share what you think.
        </p>
      ) : (
        <ul className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id} className="border-t border-line pt-6">
              <div className="flex items-center justify-between gap-4">
                <Stars rating={review.rating} />
                {review.isVerifiedPurchase ? (
                  <span className="aw-badge bg-[color-mix(in_srgb,var(--color-brand-soft)_12%,transparent)] text-brand-soft">
                    Verified purchase
                  </span>
                ) : null}
              </div>

              {review.title ? <h3 className="mt-3 text-lg">{review.title}</h3> : null}

              {review.body ? (
                <p className="mt-2 text-[0.875rem] leading-relaxed text-ink">{review.body}</p>
              ) : null}

              <p className="mt-3 text-xs text-muted">
                {review.authorName} · {formatDate(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <div className="mt-10 max-w-xl">
          <ReviewForm productSlug={productSlug} />
        </div>
      ) : null}
    </section>
  );
}
