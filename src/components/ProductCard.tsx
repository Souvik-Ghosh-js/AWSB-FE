import Image from 'next/image';
import Link from 'next/link';

import { formatPaise } from '@/lib/format';
import type { ProductSummary } from '@/lib/types';
import { Stars } from './ui';

/**
 * Catalogue grid card.
 *
 * The photograph carries the card; the type is deliberately quiet beneath it.
 * Price is the only gold element — that restraint is what makes gold read as
 * expensive rather than cheap.
 *
 * `priority` is passed for the first row so the LCP image is not lazy-loaded.
 */
export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductSummary;
  priority?: boolean;
}) {
  const image = product.primaryImage;
  const soldOut = product.inStock === false;

  // NO "Save x%" badge here.
  //
  // This used to read discountPercent(minPricePaise, maxPricePaise), which is
  // not a discount at all: min is the 3ml price and max is the 12ml price, so
  // every product in the catalogue advertised a fake ~71% saving. A summary
  // carries no compare-at price, so a genuine discount cannot be computed from
  // it — the real per-size saving is shown on the product page, where
  // variant.compareAtPaise actually exists.

  return (
    <article className="group aw-tile flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <div className="aw-plate relative aspect-[4/5] w-full overflow-hidden border-b border-line">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 380px"
              priority={priority}
              className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.035]"
              // Product images come from object storage; if one 404s the card
              // must still be usable, so the alt text carries the name.
              unoptimized={image.url.startsWith('data:')}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="aw-eyebrow">No image</span>
            </div>
          )}

          {soldOut ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-bg)_68%,transparent)]">
              <span className="aw-eyebrow border border-line-strong bg-surface px-3 py-1.5 text-ink">
                Sold out
              </span>
            </div>
          ) : null}

        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {product.scentFamily ? (
          <p className="aw-eyebrow mb-2">{product.scentFamily}</p>
        ) : null}

        <h3 className="text-lg sm:text-xl">
          <Link
            href={`/product/${product.slug}`}
            className="aw-link-underline transition-colors hover:text-brand-soft"
          >
            {product.name}
          </Link>
        </h3>

        {product.tagline ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-soft">
            {product.tagline}
          </p>
        ) : null}

        {product.ratingCount > 0 ? (
          <div className="mt-3">
            <Stars rating={product.ratingAvg} count={product.ratingCount} />
          </div>
        ) : null}

        {/* Pinned to the bottom so prices line up across a row of cards whose
            taglines wrap to different heights. */}
        <p className="mt-auto flex items-baseline gap-1.5 pt-4">
          <span className="text-xs text-muted">From</span>
          <span className="aw-price text-xl sm:text-2xl">
            {formatPaise(product.minPricePaise, { compact: true })}
          </span>
        </p>
      </div>
    </article>
  );
}
