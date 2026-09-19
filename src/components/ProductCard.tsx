'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { addToCart, quantityOf, subscribeToCart } from '@/lib/cart';
import { formatPaise } from '@/lib/format';
import type { ProductSummary, Variant } from '@/lib/types';
import { EASE, SPRING } from './motion';
import { Photo } from './Photo';

/**
 * Catalogue card that SELLS.
 *
 * The first version was a picture, a name and "From ₹…" — a showcase card.
 * A customer had to open the product page to see the three prices and open
 * it again to buy. This one puts the size picker and the Add button on the
 * card, so the grid on the home page is the shop, not a preview of it.
 *
 * Everything it needs is on the summary the list endpoint already returns
 * (variants with price and stock), so adding to cart costs no request.
 *
 * `priority` is passed for the first row so the LCP image is not lazy-loaded.
 * Those same cards skip the hidden start state of the scroll reveal: they are
 * on screen at first paint, and hiding them until hydration would delay LCP.
 *
 * `index` is the card's position in its grid; the reveal delay is derived from
 * its column so each row arrives left to right rather than all at once.
 */
export function ProductCard({
  product,
  priority = false,
  index = 0,
}: {
  product: ProductSummary;
  priority?: boolean;
  index?: number;
}) {
  const image = product.primaryImage;

  const variants = useMemo(
    () => [...(product.variants ?? [])].sort((a, b) => a.sizeMl - b.sizeMl),
    [product.variants]
  );

  // Default to the cheapest size that can actually be bought.
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const first = variants.find((v) => v.inStock) ?? variants[0];
    return first?.id ?? null;
  });
  const selected: Variant | undefined = variants.find((v) => v.id === selectedId) ?? variants[0];

  const [inCart, setInCart] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (!selected) return;
    const sync = () => setInCart(quantityOf(selected.id));
    sync();
    return subscribeToCart(sync);
  }, [selected]);

  useEffect(() => {
    setJustAdded(false);
  }, [selectedId]);

  const fromPaise = product.fromPricePaise ?? product.minPricePaise ?? selected?.pricePaise ?? 0;
  const anyInStock = variants.length > 0 ? variants.some((v) => v.inStock) : product.inStock !== false;
  const canBuy = Boolean(selected?.inStock);

  const handleAdd = () => {
    if (!selected || !selected.inStock) return;
    addToCart(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        images: product.primaryImage ? [product.primaryImage] : [],
      },
      selected,
      1
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 3500);
  };

  return (
    <motion.article
      data-motion=""
      className="aw-tile group flex flex-col"
      initial={priority ? false : 'hidden'}
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -6% 0px' }}
      variants={{
        hidden: { opacity: 0, y: 22 },
        show: {
          opacity: 1,
          y: 0,
          // Four columns on desktop, two on phones; modulo 4 staggers both.
          transition: { duration: 0.55, ease: EASE, delay: (index % 4) * 0.07 },
        },
      }}
      // The lift lives here rather than in .aw-tile:hover — once Motion has
      // written an inline transform, a CSS hover transform can no longer win.
      whileHover={{ y: -5, transition: SPRING }}
    >
      {/* ------------------------------------------------------ image */}
      <Link
        href={`/product/${product.slug}`}
        className="relative block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <div className="aw-plate relative aspect-[4/5] w-full overflow-hidden border-b border-line">
          {image ? (
            <Image
              src={image.url}
              alt={image.altText ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
              priority={priority}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              unoptimized={image.url.startsWith('data:')}
            />
          ) : (
            <Photo
              src={null}
              alt={product.name}
              label={product.name}
              ratio="h-full w-full"
              className="h-full w-full"
            />
          )}

          {!anyInStock ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--color-bg)_70%,transparent)]">
              <span className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white">
                Sold out
              </span>
            </div>
          ) : null}

          {product.scentFamily ? (
            <span className="absolute top-3 left-3 rounded-full bg-white/92 px-2.5 py-1 text-2xs font-semibold tracking-[0.08em] text-brand-deep uppercase backdrop-blur">
              {product.scentFamily}
            </span>
          ) : null}
        </div>
      </Link>

      {/* ------------------------------------------------------- body */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[1.1875rem] leading-tight">
          <Link href={`/product/${product.slug}`} className="transition-colors hover:text-brand-soft">
            {product.name}
          </Link>
        </h3>

        {product.tagline ? (
          <p className="mt-1 line-clamp-1 text-sm text-soft">{product.tagline}</p>
        ) : null}

        {/* ------------------------------------------------ sizes */}
        {variants.length > 0 ? (
          // LayoutGroup scopes the sliding highlight to this card, so two cards
          // on one page can never animate a pill between each other.
          <LayoutGroup id={`card-sizes-${product.id}`}>
            <div
              className="mt-3 grid grid-cols-3 gap-1.5"
              role="radiogroup"
              aria-label={`${product.name} size`}
            >
              {variants.map((v) => {
                const active = v.id === selected?.id;
                return (
                  <motion.button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!v.inStock}
                    onClick={() => setSelectedId(v.id)}
                    whileTap={v.inStock ? { scale: 0.95 } : undefined}
                    className={`relative flex min-h-11 flex-col items-center justify-center rounded-md border px-1 py-1.5 leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? 'border-brand text-white'
                        : 'border-line-strong bg-surface text-ink hover:border-brand'
                    }`}
                  >
                    {active ? (
                      <motion.span
                        layoutId="size-pill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-[5px] bg-brand"
                        transition={SPRING}
                      />
                    ) : null}
                    <span className="relative text-xs font-semibold">{v.sizeMl} ml</span>
                    <span
                      className={`relative mt-1 text-2xs ${active ? 'text-white/85' : 'text-muted'}`}
                    >
                      {formatPaise(v.pricePaise, { compact: true })}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </LayoutGroup>
        ) : null}

        {/* -------------------------------------------- price + add */}
        <div className="mt-auto pt-4">
          <div className="flex items-baseline justify-between gap-2">
            {/* Keyed by the price so a size change rolls the old figure out
                and the new one in, instead of the digits just swapping. */}
            <span className="relative inline-flex overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={selected?.pricePaise ?? fromPaise}
                  className="text-2xl font-bold tracking-tight text-ink"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: EASE }}
                >
                  {formatPaise(selected?.pricePaise ?? fromPaise, { compact: true })}
                </motion.span>
              </AnimatePresence>
            </span>
            {selected?.compareAtPaise && selected.compareAtPaise > selected.pricePaise ? (
              <span className="text-sm text-muted line-through">
                {formatPaise(selected.compareAtPaise, { compact: true })}
              </span>
            ) : selected ? (
              <span className="text-xs text-muted">{selected.sizeMl} ml bottle</span>
            ) : null}
          </div>

          {variants.length > 0 ? (
            <motion.button
              type="button"
              onClick={handleAdd}
              disabled={!canBuy}
              whileTap={canBuy ? { scale: 0.97 } : undefined}
              transition={SPRING}
              className={`aw-btn mt-3 w-full overflow-hidden ${justAdded ? 'aw-btn-outline' : 'aw-btn-primary'}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={justAdded ? 'added' : canBuy ? 'add' : 'sold-out'}
                  className="inline-block"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.16, ease: EASE }}
                >
                  {justAdded ? 'Added ✓' : canBuy ? 'Add to cart' : 'Sold out'}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          ) : (
            <Link href={`/product/${product.slug}`} className="aw-btn aw-btn-primary mt-3 w-full">
              View
            </Link>
          )}

          <div aria-live="polite" className="min-h-[1.25rem]">
            {justAdded ? (
              <p className="mt-2 text-center text-xs text-brand-soft">
                In your cart ·{' '}
                <Link href="/cart" className="font-semibold underline underline-offset-2">
                  Checkout
                </Link>
              </p>
            ) : inCart > 0 ? (
              <p className="mt-2 text-center text-xs text-muted">{inCart} in cart</p>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
