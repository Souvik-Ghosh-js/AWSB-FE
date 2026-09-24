'use client';

import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { validateCart } from '@/lib/api';
import {
  clearCart,
  getCart,
  reconcileCart,
  removeFromCart,
  subscribeToCart,
  toCartLines,
  updateQuantity,
  type Cart,
} from '@/lib/cart';
import { formatPaise, formatSize, plural } from '@/lib/format';
import { SHOP } from '@/lib/shop';
import type { CartAdjustment } from '@/lib/types';
import { EASE } from './motion';
import { EmptyState, LineSkeleton } from './ui';

/**
 * The cart.
 *
 * On mount it asks the API to re-price and stock-check every line. The prices
 * held in localStorage are a display cache and can be stale (or edited by
 * hand), so the server's figures replace them and any adjustment is announced
 * rather than applied silently — a shopper who sees a total change without
 * explanation assumes they are being cheated.
 */
export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [adjustments, setAdjustments] = useState<CartAdjustment[]>([]);
  const [validating, setValidating] = useState(false);
  const [validationFailed, setValidationFailed] = useState(false);

  // Read localStorage only after mount — it does not exist during SSR.
  useEffect(() => {
    const sync = () => setCart(getCart());
    sync();
    return subscribeToCart(sync);
  }, []);

  const revalidate = useCallback(async (current: Cart) => {
    if (current.items.length === 0) {
      setAdjustments([]);
      return;
    }

    setValidating(true);
    setValidationFailed(false);

    try {
      const result = await validateCart(toCartLines(current));
      setAdjustments(result.adjustments ?? []);

      if (result.items) {
        const reconciled = reconcileCart(
          result.items.map((i) => ({
            variantId: i.variantId,
            unitPricePaise: i.unitPricePaise,
            availableQuantity: i.availableQuantity,
          }))
        );
        setCart(reconciled);
      }
    } catch {
      // The API is unreachable. Keep showing the cached cart — the shopper can
      // still read it — but flag that the totals are not confirmed, and let
      // checkout be the place where it must succeed.
      setValidationFailed(true);
    } finally {
      setValidating(false);
    }
  }, []);

  // Validate once, on the first non-empty read.
  const [hasValidated, setHasValidated] = useState(false);
  useEffect(() => {
    if (!cart || hasValidated) return;
    setHasValidated(true);
    void revalidate(cart);
  }, [cart, hasValidated, revalidate]);

  if (cart === null) {
    return (
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="flex gap-5">
              <LineSkeleton className="h-28 w-24 shrink-0" />
              <div className="flex-1 space-y-3">
                <LineSkeleton className="h-4 w-1/2" />
                <LineSkeleton className="h-3 w-24" />
                <LineSkeleton className="h-9 w-32" />
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-4">
          <LineSkeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Nothing chosen yet. Every attar is available in 3ml, 6ml and 12ml."
        action={
          <Link href="/shop" className="aw-btn aw-btn-primary">
            Browse the collection
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      {/* ------------------------------------------------------- the lines */}
      <div className="lg:col-span-8">
        {adjustments.length > 0 ? (
          <div
            role="status"
            className="mb-7 border border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] px-5 py-4"
          >
            <p className="text-[0.8125rem] font-medium text-ink">
              We updated your cart
            </p>
            <ul className="mt-2 space-y-1">
              {adjustments.map((adjustment, i) => (
                <li key={i} className="text-[0.8125rem] text-muted">
                  {adjustment.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {validationFailed ? (
          <div
            role="status"
            className="mb-7 border border-line-strong bg-surface-alt px-5 py-4"
          >
            <p className="text-[0.8125rem] text-muted">
              We could not confirm prices and stock just now. Your cart is shown from
              this device — the final total is confirmed at checkout.
            </p>
          </div>
        ) : null}

        <ul className="border-t border-line">
          {/* A removed line collapses and fades, and `layout` slides the lines
              below it up into the gap, so the shopper sees WHAT left the cart
              rather than the list simply being shorter. */}
          <AnimatePresence initial={false}>
          {cart.items.map((item) => (
            <motion.li
              key={item.variantId}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0, x: -24 }}
              transition={{ duration: 0.32, ease: EASE }}
              className="overflow-hidden border-b border-line"
            >
              <div className="flex gap-4 py-6 sm:gap-6">
              <Link
                href={`/product/${item.slug}`}
                className="aw-plate relative h-28 w-24 shrink-0 overflow-hidden rounded-sm border border-line sm:h-32 sm:w-28"
              >
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized={item.imageUrl.startsWith('data:')}
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg leading-snug">
                      <Link
                        href={`/product/${item.slug}`}
                        className="transition-colors hover:text-brand-soft"
                      >
                        {item.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-[0.8125rem] text-muted">
                      {formatSize(item.sizeMl, item.sizeUnit)}
                    </p>
                  </div>

                  <p className="aw-price shrink-0 text-base sm:text-lg">
                    {formatPaise(item.unitPricePaise * item.quantity, { compact: true })}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                  <div className="flex items-center rounded-sm border border-line-strong bg-surface">
                    <button
                      type="button"
                      onClick={() => setCart(updateQuantity(item.variantId, item.quantity - 1))}
                      aria-label={`Decrease quantity of ${item.name} ${formatSize(item.sizeMl, item.sizeUnit)}`}
                      className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand"
                    >
                      −
                    </button>
                    <span className="aw-tabular w-8 text-center text-sm">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCart(updateQuantity(item.variantId, item.quantity + 1))}
                      aria-label={`Increase quantity of ${item.name} ${formatSize(item.sizeMl, item.sizeUnit)}`}
                      className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted">
                      {formatPaise(item.unitPricePaise, { compact: true })} each
                    </span>
                    <button
                      type="button"
                      onClick={() => setCart(removeFromCart(item.variantId))}
                      className="text-xs text-muted underline underline-offset-4 transition-colors hover:text-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </motion.li>
          ))}
          </AnimatePresence>
        </ul>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/shop"
            className="text-[0.8125rem] text-brand-soft underline underline-offset-4"
          >
            ← Continue shopping
          </Link>
          <button
            type="button"
            onClick={() => setCart(clearCart())}
            className="text-xs text-muted underline underline-offset-4 transition-colors hover:text-danger"
          >
            Empty cart
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- the summary */}
      <div className="lg:col-span-4">
        <div className="aw-card sticky top-24 p-6 sm:p-7">
          <h2 className="text-xl">Summary</h2>
          <hr className="aw-rule mt-4" />

          <dl className="mt-5 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[0.8125rem] text-muted">
                Subtotal ({cart.itemCount} {plural(cart.itemCount, 'item')})
              </dt>
              <dd className="aw-tabular text-[0.9375rem]">
                {formatPaise(cart.subtotalPaise, { compact: true })}
              </dd>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[0.8125rem] text-muted">Shipping</dt>
              <dd className="text-[0.8125rem] text-muted">Calculated at checkout</dd>
            </div>
          </dl>

          <hr className="mt-5 border-t border-line" />

          <div className="mt-4 flex items-baseline justify-between gap-4">
            <span className="text-[0.9375rem]">Total</span>
            <span className="aw-price text-xl">
              {formatPaise(cart.subtotalPaise, { compact: true })}
              <span className="ml-1 text-xs text-muted">+ shipping</span>
            </span>
          </div>

          <Link
            href="/checkout"
            aria-disabled={validating}
            className="aw-btn aw-btn-primary mt-6 w-full"
          >
            {validating ? 'Checking stock…' : 'Proceed to checkout'}
          </Link>

          <p className="mt-4 text-xs leading-relaxed text-muted">
            Shipping is {formatPaise(SHOP.shipping.kolkataPaise, { compact: true })} within
            Kolkata and {formatPaise(SHOP.shipping.restOfIndiaPaise, { compact: true })}{' '}
            elsewhere in India, calculated from your pincode at checkout.
          </p>

          <p className="mt-3 text-xs leading-relaxed text-muted">
            Secure payment by UPI, card or netbanking through Razorpay.
          </p>
        </div>
      </div>
    </div>
  );
}
