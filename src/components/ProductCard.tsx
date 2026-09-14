import Image from 'next/image';
import Link from 'next/link';

import { discountPercent, formatPaise } from '@/lib/format';
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
  const saving = discountPercent(product.minPricePaise, product.maxPricePaise ?? null);

  return (
    <article className="group flex flex-col">
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <div className="aw-plate relative aspect-[4/5] w-full overflow-hidden rounded-sm border border-line">
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

          {!soldOut && saving ? (
            <span className="absolute top-3 left-3 bg-brand px-2 py-1 text-[0.625rem] font-medium tracking-[0.1em] text-[#f7f4ea] uppercase">
              Save {saving}%
            </span>
          ) : null}
        </div>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        {product.scentFamily ? (
          <p className="aw-eyebrow mb-2 text-[0.625rem]">{product.scentFamily}</p>
        ) : null}

        <h3 className="text-lg leading-snug sm:text-xl">
          <Link
            href={`/product/${product.slug}`}
            className="aw-link-underline transition-colors hover:text-brand-soft"
          >
            {product.name}
          </Link>
        </h3>

        {product.tagline ? (
          <p className="mt-1.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-muted">
            {product.tagline}
          </p>
        ) : null}

        <div className="mt-3 flex items-center gap-3">
          {product.ratingCount > 0 ? (
            <Stars rating={product.ratingAvg} count={product.ratingCount} />
          ) : null}
        </div>

        <p className="mt-3.5 flex items-baseline gap-1.5">
          <span className="text-[0.6875rem] tracking-[0.1em] text-muted uppercase">From</span>
          <span className="aw-price text-lg sm:text-xl">
            {formatPaise(product.minPricePaise, { compact: true })}
          </span>
        </p>
      </div>
    </article>
  );
}
