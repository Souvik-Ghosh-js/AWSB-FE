'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { addToCart, quantityOf, subscribeToCart, MAX_QUANTITY_PER_LINE } from '@/lib/cart';
import { discountPercent, formatPaise, formatSize } from '@/lib/format';
import type { ProductDetail, Variant } from '@/lib/types';
import { StockBadge } from './ui';

/**
 * Size selector and add-to-cart.
 *
 * The heart of the product page: 3ml / 6ml / 12ml each show THEIR OWN price
 * and THEIR OWN stock, because in the schema every variant carries an
 * independent price_paise and stock_qty. A sold-out 12ml must not make the
 * 3ml look unavailable.
 */
export function ProductPurchase({ product }: { product: ProductDetail }) {
  const variants = useMemo(
    () => [...product.variants].sort((a, b) => a.sizeMl - b.sizeMl),
    [product.variants]
  );

  // Default to the first size that is actually purchasable, so a shopper
  // does not land on a sold-out selection.
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const firstAvailable = variants.find((v) => v.inStock) ?? variants[0];
    return firstAvailable?.id ?? null;
  });

  const [quantity, setQuantity] = useState(1);
  const [inCart, setInCart] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const selected: Variant | undefined =
    variants.find((v) => v.id === selectedId) ?? variants[0];

  // Keep "n in cart" live, including changes made in another tab.
  useEffect(() => {
    if (!selected) return;
    const sync = () => setInCart(quantityOf(selected.id));
    sync();
    return subscribeToCart(sync);
  }, [selected]);

  // Reset the quantity when the shopper switches size — carrying 5 across
  // from a cheap 3ml to a 12ml is rarely what they meant.
  useEffect(() => {
    setQuantity(1);
    setJustAdded(false);
  }, [selectedId]);

  if (variants.length === 0) {
    return (
      <div className="aw-card p-6">
        <p className="text-sm text-muted">
          This fragrance is not available for purchase at the moment.
        </p>
      </div>
    );
  }

  const saving = selected ? discountPercent(selected.pricePaise, selected.compareAtPaise) : null;
  const canBuy = Boolean(selected?.inStock);

  const handleAdd = () => {
    if (!selected || !selected.inStock) return;
    addToCart(product, selected, quantity);
    setJustAdded(true);
    // The confirmation is transient; the cart badge is the persistent signal.
    window.setTimeout(() => setJustAdded(false), 4000);
  };

  return (
    <div>
      {/* ------------------------------------------------------ the price */}
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="aw-price text-[2rem] leading-none sm:text-[2.25rem]">
          {selected ? formatPaise(selected.pricePaise, { compact: true }) : '—'}
        </span>

        {selected?.compareAtPaise ? (
          <span className="text-base text-muted line-through">
            {formatPaise(selected.compareAtPaise, { compact: true })}
          </span>
        ) : null}

        {saving ? (
          <span className="aw-badge bg-[color-mix(in_srgb,var(--color-accent)_16%,transparent)] text-accent">
            Save {saving}%
          </span>
        ) : null}
      </div>

      {/* No GST line here, deliberately: the shop is not registered, so the
          price shown is the final price. */}
      <p className="mt-1.5 text-xs text-muted">
        Price includes all charges. Shipping calculated at checkout.
      </p>

      {/* ------------------------------------------------- size selector */}
      <fieldset className="mt-7">
        <legend className="aw-eyebrow mb-3">
          Choose your size
          {selected ? (
            <span className="ml-2 text-ink normal-case">
              {formatSize(selected.sizeMl, selected.sizeUnit)} selected
            </span>
          ) : null}
        </legend>

        <div className="grid grid-cols-3 gap-2.5">
          {variants.map((variant) => {
            const isSelected = variant.id === selected?.id;
            const soldOut = !variant.inStock;

            return (
              <label
                key={variant.id}
                className={`relative flex cursor-pointer flex-col items-center rounded-sm border px-2 py-3.5 text-center transition-colors ${
                  isSelected
                    ? 'border-brand bg-[color-mix(in_srgb,var(--color-brand)_5%,transparent)]'
                    : 'border-line-strong bg-surface hover:border-brand-soft'
                } ${soldOut ? 'opacity-55' : ''}`}
              >
                <input
                  type="radio"
                  name="variant"
                  value={variant.id}
                  checked={isSelected}
                  disabled={soldOut}
                  onChange={() => setSelectedId(variant.id)}
                  className="sr-only"
                />

                <span className="font-[family-name:var(--font-display)] text-xl leading-none text-brand">
                  {variant.sizeMl}
                  <span className="ml-0.5 text-[0.6875rem] tracking-[0.06em]">
                    {variant.sizeUnit === 'sticks' ? 'sk' : variant.sizeUnit}
                  </span>
                </span>

                {/* Per-size price — the point of the whole control. */}
                <span className="aw-price mt-2 text-[0.9375rem] leading-none">
                  {formatPaise(variant.pricePaise, { compact: true })}
                </span>

                <span className="mt-2 text-[0.625rem] leading-tight tracking-[0.04em] text-muted">
                  {soldOut ? 'Sold out' : variant.isLowStock ? 'Few left' : 'In stock'}
                </span>

                {isSelected ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-px -right-px h-2.5 w-2.5 bg-accent"
                    style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
                  />
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ---------------------------------------------------- stock state */}
      {selected ? (
        <div className="mt-5">
          <StockBadge inStock={selected.inStock} isLowStock={selected.isLowStock} />
        </div>
      ) : null}

      {/* ------------------------------------------- quantity + add to cart */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="flex items-center rounded-sm border border-line-strong bg-surface">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={!canBuy || quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-12 w-12 items-center justify-center text-lg text-ink transition-colors hover:text-brand disabled:opacity-35"
          >
            −
          </button>
          <span
            aria-live="polite"
            className="aw-tabular w-10 text-center text-[0.9375rem]"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY_PER_LINE, q + 1))}
            disabled={!canBuy || quantity >= MAX_QUANTITY_PER_LINE}
            aria-label="Increase quantity"
            className="flex h-12 w-12 items-center justify-center text-lg text-ink transition-colors hover:text-brand disabled:opacity-35"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canBuy}
          className="aw-btn aw-btn-primary flex-1"
        >
          {canBuy ? 'Add to cart' : 'Sold out'}
        </button>
      </div>

      {/* Confirmation. aria-live so a screen reader announces it. */}
      <div aria-live="polite" className="min-h-[1.5rem]">
        {justAdded ? (
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8125rem] text-brand-soft">
            <span aria-hidden="true">✓</span>
            Added to your cart.
            <Link href="/cart" className="underline underline-offset-4">
              View cart
            </Link>
          </p>
        ) : inCart > 0 ? (
          <p className="mt-3 text-[0.8125rem] text-muted">
            {inCart} × {selected ? formatSize(selected.sizeMl, selected.sizeUnit) : ''} already in your{' '}
            <Link href="/cart" className="underline underline-offset-4 hover:text-brand">
              cart
            </Link>
            .
          </p>
        ) : null}
      </div>

      {!canBuy ? (
        <p className="mt-2 text-[0.8125rem] text-muted">
          This size is between lots.{' '}
          <Link href="/contact" className="underline underline-offset-4 hover:text-brand">
            Write to us
          </Link>{' '}
          and we will tell you when it is back.
        </p>
      ) : null}
    </div>
  );
}
