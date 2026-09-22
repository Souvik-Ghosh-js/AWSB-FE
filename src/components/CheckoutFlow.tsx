'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ApiError,
  RAZORPAY_KEY_ID,
  createCheckoutSession,
  getShippingQuote,
  lookupPincode,
  validateCart,
  validateCoupon,
  verifyCheckout,
} from '@/lib/api';
import {
  clearCart,
  getCart,
  reconcileCart,
  subscribeToCart,
  toCartLines,
  type Cart,
} from '@/lib/cart';
import { formatPaise, plural } from '@/lib/format';
import {
  RAZORPAY_THEME,
  describePaymentFailure,
  loadRazorpayCheckout,
  type RazorpayFailureResponse,
  type RazorpayHandlerResponse,
} from '@/lib/razorpay';
import { SHOP } from '@/lib/shop';
import {
  EMPTY_ADDRESS,
  INDIAN_STATES,
  isAddressComplete,
  looksLikeKolkata,
  normaliseAddress,
  stateMismatchWarning,
  validateAddress,
  type AddressErrors,
} from '@/lib/validation';
import type { CouponPreview, ShippingAddress, ShippingQuote } from '@/lib/types';
import { EmptyState, LineSkeleton } from './ui';

/**
 * Checkout — the critical flow.
 *
 * Sequence, and why each step is where it is:
 *
 *   1. Re-price the cart against the API. localStorage is shopper-editable, so
 *      nothing here is trusted until the server has confirmed it.
 *   2. Collect a COMPLETE address. Place Order stays disabled until every
 *      required field validates: blocking here is far cheaper than paying a
 *      courier re-attempt fee for a vague address.
 *   3. The pincode drives a live shipping quote (₹49 Kolkata / ₹99 elsewhere)
 *      and autofills city/district/state, which catches the classic mismatch
 *      of a Delhi pincode under "Kolkata".
 *   4. POST /checkout/session → the API creates the order, reserves stock and
 *      mints a Razorpay order_id.
 *   5. Load checkout.js, open Razorpay with that order_id.
 *   6. On the handler callback, POST the three fields to /checkout/verify and
 *      redirect. The browser handler is only a fast thank-you path — the
 *      AUTHORITATIVE fulfilment trigger is the order.paid webhook server-side,
 *      because the browser can close mid-redirect.
 *
 * NO COD anywhere, by design.
 */

type Stage = 'idle' | 'creating' | 'opening' | 'verifying';

export function CheckoutFlow() {
  const router = useRouter();

  /* ------------------------------------------------------------- cart */
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartError, setCartError] = useState<string | null>(null);
  const [validatedOnce, setValidatedOnce] = useState(false);

  /* ---------------------------------------------------------- address */
  const [address, setAddress] = useState<ShippingAddress>(EMPTY_ADDRESS);
  const [touched, setTouched] = useState<Partial<Record<keyof ShippingAddress, boolean>>>({});
  const [errors, setErrors] = useState<AddressErrors>({});
  const [note, setNote] = useState('');

  /* --------------------------------------------------------- shipping */
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [resolvedState, setResolvedState] = useState<string | null>(null);

  /* ----------------------------------------------------------- coupon */
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<CouponPreview | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);

  /* ---------------------------------------------------------- payment */
  const [stage, setStage] = useState<Stage>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Guards a double-submit: React state updates are async, so a fast second
  // click could otherwise create two orders and reserve stock twice.
  const submitting = useRef(false);

  /* ----------------------------------------------------- load the cart */

  useEffect(() => {
    const sync = () => setCart(getCart());
    sync();
    return subscribeToCart(sync);
  }, []);

  useEffect(() => {
    if (!cart || validatedOnce || cart.items.length === 0) return;
    setValidatedOnce(true);

    void (async () => {
      try {
        const result = await validateCart(toCartLines(cart));
        if (result.items) {
          setCart(
            reconcileCart(
              result.items.map((i) => ({
                variantId: i.variantId,
                unitPricePaise: i.unitPricePaise,
                availableQuantity: i.availableQuantity,
              }))
            )
          );
        }
        if (result.adjustments?.length) {
          setCartError(
            'Some items changed price or availability. Please review your cart before paying.'
          );
        }
      } catch (err) {
        setCartError(
          err instanceof ApiError
            ? err.friendlyMessage
            : 'We could not confirm your cart. Please try again.'
        );
      }
    })();
  }, [cart, validatedOnce]);

  /* ---------------------------------------- pincode → quote + autofill */

  const pincode = address.pincode;

  useEffect(() => {
    // Only look up a structurally valid pincode; six digits is the trigger.
    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      setQuote(null);
      setResolvedState(null);
      return;
    }

    let cancelled = false;
    setQuoteLoading(true);

    // Debounced: the shopper is still typing the last digit.
    const timer = window.setTimeout(() => {
      void (async () => {
        const subtotal = cart?.subtotalPaise ?? 0;

        try {
          const [quoteResult, lookup] = await Promise.allSettled([
            getShippingQuote(pincode, subtotal),
            lookupPincode(pincode),
          ]);

          if (cancelled) return;

          if (quoteResult.status === 'fulfilled') {
            setQuote(quoteResult.value);
          } else {
            // Fall back to the documented flat rates so the shopper still sees
            // a figure. The API's quote is authoritative and is re-resolved
            // server-side when the order is created.
            const fallbackRate = looksLikeKolkata(pincode)
              ? SHOP.shipping.kolkataPaise
              : SHOP.shipping.restOfIndiaPaise;
            setQuote({
              zoneId: 0,
              zoneSlug: looksLikeKolkata(pincode) ? 'kolkata' : 'rest_of_india',
              zoneName: looksLikeKolkata(pincode) ? 'Kolkata' : 'Rest of India',
              shippingPaise: fallbackRate,
              isFree: false,
            });
          }

          // Autofill city/district/state, but never overwrite what the shopper
          // has already typed — they know their address better than a lookup.
          if (lookup.status === 'fulfilled' && lookup.value) {
            const data = lookup.value;
            setResolvedState(data.state ?? null);
            setAddress((prev) => ({
              ...prev,
              city: prev.city.trim() ? prev.city : (data.city ?? prev.city),
              district: prev.district?.trim() ? prev.district : (data.district ?? prev.district),
              state: prev.state.trim() ? prev.state : (data.state ?? prev.state),
            }));
          }
        } finally {
          if (!cancelled) setQuoteLoading(false);
        }
      })();
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pincode, cart?.subtotalPaise]);

  /* ------------------------------------------------------------ totals */

  const subtotalPaise = cart?.subtotalPaise ?? 0;
  const discountPaise = coupon?.valid ? coupon.discountPaise : 0;
  const shippingPaise = quote?.shippingPaise ?? 0;
  const totalPaise = Math.max(0, subtotalPaise - discountPaise) + shippingPaise;

  const addressValid = isAddressComplete(address);
  const mismatch = stateMismatchWarning(address.state, resolvedState);

  // The Place Order gate. All four conditions must hold.
  const canPlaceOrder =
    addressValid &&
    quote !== null &&
    (cart?.items.length ?? 0) > 0 &&
    stage === 'idle';

  /* ----------------------------------------------------------- handlers */

  const setField = useCallback(
    (field: keyof ShippingAddress, value: string) => {
      setAddress((prev) => {
        const next = { ...prev, [field]: value };
        // Re-validate live once a field has been touched, so an error clears
        // as soon as it is fixed rather than only on blur.
        setErrors((prevErrors) =>
          prevErrors[field] ? { ...validateAddress(next) } : prevErrors
        );
        return next;
      });
    },
    []
  );

  const blurField = useCallback(
    (field: keyof ShippingAddress) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors(validateAddress(address));
    },
    [address]
  );

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code || !cart) return;

    setCouponChecking(true);
    setCouponError(null);

    try {
      const preview = await validateCoupon(code, toCartLines(cart));
      if (preview.valid) {
        setCoupon(preview);
        setCouponError(null);
      } else {
        setCoupon(null);
        setCouponError(preview.message ?? 'That code is not valid for this order.');
      }
    } catch (err) {
      setCoupon(null);
      setCouponError(
        err instanceof ApiError ? err.friendlyMessage : 'We could not check that code.'
      );
    } finally {
      setCouponChecking(false);
    }
  };

  /**
   * Place Order: create the session, open Razorpay, verify, redirect.
   */
  const placeOrder = async () => {
    if (submitting.current) return;

    // Belt and braces: re-run validation even though the button is disabled,
    // in case it was re-enabled by a devtools edit.
    const finalErrors = validateAddress(address);
    if (Object.keys(finalErrors).length > 0) {
      setErrors(finalErrors);
      setTouched(
        Object.fromEntries(Object.keys(finalErrors).map((k) => [k, true])) as Record<
          keyof ShippingAddress,
          boolean
        >
      );
      return;
    }

    if (!cart || cart.items.length === 0) return;

    submitting.current = true;
    setPaymentError(null);
    setStage('creating');

    try {
      // 1. Create the order server-side. This reserves stock and mints the
      //    Razorpay order id. Prices are recomputed by the API; nothing from
      //    localStorage is trusted.
      const session = await createCheckoutSession({
        items: toCartLines(cart),
        address: normaliseAddress(address),
        couponCode: coupon?.valid ? coupon.code : null,
        customerNote: note.trim() || null,
      });

      // Hand the email to the confirmation page so the shopper is not asked
      // to retype what they just entered. sessionStorage, not localStorage:
      // it dies with the tab, and it is a convenience, not an auth token —
      // the API still requires the matching email for the lookup.
      try {
        window.sessionStorage.setItem('awsb.checkout.email', normaliseAddress(address).email);
      } catch {
        // Blocked storage: the confirmation page simply asks for the email.
      }

      // 2. Load Razorpay Checkout.
      setStage('opening');
      await loadRazorpayCheckout();

      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        throw new Error('The payment window could not be opened. Please try again.');
      }

      const keyId = session.razorpayKeyId || RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error(
          'Payments are not configured for this site. Please contact us to complete your order.'
        );
      }

      // 3. Open the modal against the server-minted order id.
      const rzp = new RazorpayCtor({
        key: keyId,
        amount: session.amountPaise,
        currency: session.currency || 'INR',
        name: SHOP.name,
        description: `Order ${session.orderNumber}`,
        order_id: session.razorpayOrderId,
        prefill: {
          name: address.fullName,
          email: address.email,
          contact: address.phone,
        },
        notes: { order_number: session.orderNumber },
        theme: { ...RAZORPAY_THEME },
        retry: { enabled: false },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            // The shopper closed the modal. The order exists as
            // pending_payment and its stock stays reserved until the API's
            // sweeper releases it, so this is recoverable, not an error.
            submitting.current = false;
            setStage('idle');
            setPaymentError(
              `Payment was not completed. Your order ${session.orderNumber} is held for ${SHOP.reservationMinutes} minutes — you can try again below.`
            );
          },
        },
        handler: (response: RazorpayHandlerResponse) => {
          void (async () => {
            setStage('verifying');
            try {
              // 4. Hand the three fields to the API for signature verification.
              await verifyCheckout({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              clearCart();
              router.push(`/order/${encodeURIComponent(session.orderNumber)}?paid=1`);
            } catch {
              // The payment succeeded but our confirmation call failed. Do NOT
              // tell the shopper the payment failed — money has moved, and the
              // order.paid webhook will confirm the order regardless. Send
              // them to the confirmation page, which polls for status.
              clearCart();
              router.push(`/order/${encodeURIComponent(session.orderNumber)}?pending=1`);
            }
          })();
        },
      });

      // 5. payment.failed can arrive BEFORE payment.captured on UPI retries,
      //    so this never irreversibly fails the order — it surfaces the
      //    message and lets the shopper try again.
      rzp.on('payment.failed', (failure: RazorpayFailureResponse) => {
        submitting.current = false;
        setStage('idle');
        setPaymentError(describePaymentFailure(failure));
      });

      rzp.open();
    } catch (err) {
      submitting.current = false;
      setStage('idle');
      setPaymentError(
        err instanceof ApiError
          ? err.friendlyMessage
          : err instanceof Error
            ? err.message
            : 'We could not start the payment. Please try again.'
      );
    }
  };

  /* -------------------------------------------------------------- render */

  if (cart === null) {
    return (
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <LineSkeleton className="h-5 w-40" />
          {Array.from({ length: 6 }, (_, i) => (
            <LineSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <div className="lg:col-span-5">
          <LineSkeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="There is nothing to check out"
        message="Your cart is empty. Choose an attar and it will appear here."
        action={
          <Link href="/shop" className="aw-btn aw-btn-primary">
            Browse the collection
          </Link>
        }
      />
    );
  }

  const showError = (field: keyof ShippingAddress) =>
    touched[field] && errors[field] ? errors[field] : undefined;

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      {/* ------------------------------------------------ the address form */}
      <div className="lg:col-span-7">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void placeOrder();
          }}
          noValidate
        >
          <h2 className="text-xl sm:text-2xl">Delivery address</h2>
          <hr className="aw-rule mt-4" />

          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <Field
              id="fullName"
              label="Full name"
              value={address.fullName}
              onChange={(v) => setField('fullName', v)}
              onBlur={() => blurField('fullName')}
              error={showError('fullName')}
              autoComplete="name"
              required
              className="sm:col-span-2"
            />

            <Field
              id="phone"
              label="Mobile number"
              value={address.phone}
              onChange={(v) => setField('phone', v.replace(/[^\d+\s-]/g, ''))}
              onBlur={() => blurField('phone')}
              error={showError('phone')}
              autoComplete="tel"
              inputMode="numeric"
              placeholder="10-digit mobile"
              hint="The courier will call this number before delivery."
              required
            />

            <Field
              id="altPhone"
              label="Alternate number"
              value={address.altPhone ?? ''}
              onChange={(v) => setField('altPhone', v.replace(/[^\d+\s-]/g, ''))}
              onBlur={() => blurField('altPhone')}
              error={showError('altPhone')}
              autoComplete="tel"
              inputMode="numeric"
              hint="Optional. Couriers usually attempt two calls."
            />

            <Field
              id="email"
              label="Email"
              type="email"
              value={address.email}
              onChange={(v) => setField('email', v)}
              onBlur={() => blurField('email')}
              error={showError('email')}
              autoComplete="email"
              hint="Your confirmation and tracking link are sent here."
              required
              className="sm:col-span-2"
            />

            <Field
              id="line1"
              label="House / flat number and building"
              value={address.line1}
              onChange={(v) => setField('line1', v)}
              onBlur={() => blurField('line1')}
              error={showError('line1')}
              autoComplete="address-line1"
              placeholder="e.g. Flat 4B, Ashiana Apartments"
              required
              className="sm:col-span-2"
            />

            <Field
              id="line2"
              label="Area / street"
              value={address.line2 ?? ''}
              onChange={(v) => setField('line2', v)}
              onBlur={() => blurField('line2')}
              error={showError('line2')}
              autoComplete="address-line2"
              placeholder="e.g. Sector V, Salt Lake"
              className="sm:col-span-2"
            />

            <Field
              id="landmark"
              label="Landmark"
              value={address.landmark ?? ''}
              onChange={(v) => setField('landmark', v)}
              onBlur={() => blurField('landmark')}
              error={showError('landmark')}
              placeholder="e.g. near Technopolis"
              hint="Optional, but it genuinely helps delivery staff find you."
              className="sm:col-span-2"
            />

            <Field
              id="pincode"
              label="Pincode"
              value={address.pincode}
              onChange={(v) => setField('pincode', v.replace(/\D/g, '').slice(0, 6))}
              onBlur={() => blurField('pincode')}
              error={showError('pincode')}
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="6 digits"
              hint={quoteLoading ? 'Checking delivery…' : undefined}
              required
            />

            <Field
              id="city"
              label="City / town"
              value={address.city}
              onChange={(v) => setField('city', v)}
              onBlur={() => blurField('city')}
              error={showError('city')}
              autoComplete="address-level2"
              required
            />

            <Field
              id="district"
              label="District"
              value={address.district ?? ''}
              onChange={(v) => setField('district', v)}
              onBlur={() => blurField('district')}
              error={showError('district')}
              hint="Filled in from your pincode where we can."
            />

            <div>
              <label htmlFor="state" className="aw-label">
                State <span className="text-accent">*</span>
              </label>
              <select
                id="state"
                value={address.state}
                onChange={(e) => setField('state', e.target.value)}
                onBlur={() => blurField('state')}
                className={`aw-field ${showError('state') ? 'aw-field-error' : ''}`}
                autoComplete="address-level1"
                aria-describedby={showError('state') ? 'state-error' : undefined}
                required
              >
                <option value="">Select a state</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {showError('state') ? (
                <p id="state-error" className="aw-error">
                  {errors.state}
                </p>
              ) : null}
            </div>
          </div>

          {/* A pincode/state contradiction warns before payment — it never
              blocks, because autofill can be wrong at district boundaries. */}
          {mismatch ? (
            <p
              role="status"
              className="mt-5 border border-[color-mix(in_srgb,var(--color-accent)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] px-4 py-3 text-[0.8125rem] text-ink"
            >
              {mismatch}
            </p>
          ) : null}

          <div className="mt-7">
            <label htmlFor="note" className="aw-label">
              Note for us
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Anything we should know — a gift message, or delivery instructions."
              className="aw-field resize-y"
            />
          </div>

          <p className="mt-7 text-xs leading-relaxed text-muted">
            By placing this order you agree to our{' '}
            <Link href="/policies/terms" className="underline underline-offset-4">
              Terms &amp; Conditions
            </Link>
            ,{' '}
            <Link href="/policies/refund" className="underline underline-offset-4">
              Refund, Cancellation &amp; Replacement Policy
            </Link>{' '}
            and{' '}
            <Link href="/policies/shipping" className="underline underline-offset-4">
              Shipping Policy
            </Link>
            .
          </p>
        </form>
      </div>

      {/* ---------------------------------------------- the order summary */}
      <div className="lg:col-span-5">
        <div className="aw-card sticky top-24 p-6 sm:p-7">
          <h2 className="text-xl">Your order</h2>
          <hr className="aw-rule mt-4" />

          <ul className="mt-5 space-y-4">
            {cart.items.map((item) => (
              <li key={item.variantId} className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[0.875rem]">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.sizeMl} ml × {item.quantity}
                  </p>
                </div>
                <span className="aw-tabular shrink-0 text-[0.875rem]">
                  {formatPaise(item.unitPricePaise * item.quantity, { compact: true })}
                </span>
              </li>
            ))}
          </ul>

          {cartError ? (
            <p className="mt-5 border border-line-strong bg-surface-alt px-4 py-3 text-[0.8125rem] text-muted">
              {cartError}{' '}
              <Link href="/cart" className="underline underline-offset-4">
                Review cart
              </Link>
            </p>
          ) : null}

          {/* Coupon */}
          <div className="mt-6 border-t border-line pt-5">
            <label htmlFor="coupon" className="aw-label">
              Discount code
            </label>
            <div className="flex gap-2">
              <input
                id="coupon"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="aw-field flex-1 uppercase"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => void applyCoupon()}
                disabled={!couponInput.trim() || couponChecking}
                className="aw-btn aw-btn-outline aw-btn-sm shrink-0"
              >
                {couponChecking ? '…' : 'Apply'}
              </button>
            </div>
            {couponError ? <p className="aw-error">{couponError}</p> : null}
            {coupon?.valid ? (
              <p className="mt-2 text-[0.8125rem] text-brand-soft">
                {coupon.code} applied — {formatPaise(coupon.discountPaise, { compact: true })}{' '}
                off.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setCoupon(null);
                    setCouponInput('');
                  }}
                  className="underline underline-offset-4"
                >
                  Remove
                </button>
              </p>
            ) : null}
          </div>

          {/* Totals */}
          <dl className="mt-6 space-y-3 border-t border-line pt-5">
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[0.8125rem] text-muted">
                Subtotal ({cart.itemCount} {plural(cart.itemCount, 'item')})
              </dt>
              <dd className="aw-tabular text-[0.875rem]">
                {formatPaise(subtotalPaise, { compact: true })}
              </dd>
            </div>

            {discountPaise > 0 ? (
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[0.8125rem] text-muted">Discount</dt>
                <dd className="aw-tabular text-[0.875rem] text-brand-soft">
                  −{formatPaise(discountPaise, { compact: true })}
                </dd>
              </div>
            ) : null}

            {/* The live shipping quote, driven by the pincode above. */}
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-[0.8125rem] text-muted">
                Shipping
                {quote ? (
                  <span className="ml-1.5 text-xs text-muted">({quote.zoneName})</span>
                ) : null}
              </dt>
              <dd className="aw-tabular text-[0.875rem]">
                {quoteLoading ? (
                  <span className="text-muted">Checking…</span>
                ) : quote ? (
                  quote.isFree ? (
                    <span className="text-brand-soft">Free</span>
                  ) : (
                    formatPaise(quote.shippingPaise, { compact: true })
                  )
                ) : (
                  <span className="text-muted">Enter pincode</span>
                )}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <span className="text-[0.9375rem]">Total</span>
            <span className="aw-price text-2xl">
              {quote ? formatPaise(totalPaise, { compact: true }) : '—'}
            </span>
          </div>

          {/* No GST line: the shop is not registered, so this is the final
              amount with no tax component to break out. */}

          {paymentError ? (
            <p
              role="alert"
              className="mt-5 border border-[color-mix(in_srgb,var(--color-danger)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_6%,transparent)] px-4 py-3 text-[0.8125rem] text-ink"
            >
              {paymentError}
            </p>
          ) : null}

          {/* The gate: disabled until the address is complete and valid. */}
          <button
            type="button"
            onClick={() => void placeOrder()}
            disabled={!canPlaceOrder}
            className="aw-btn aw-btn-primary mt-6 w-full"
          >
            {stage === 'creating'
              ? 'Preparing your order…'
              : stage === 'opening'
                ? 'Opening payment…'
                : stage === 'verifying'
                  ? 'Confirming payment…'
                  : `Place order${quote ? ` · ${formatPaise(totalPaise, { compact: true })}` : ''}`}
          </button>

          {!canPlaceOrder && stage === 'idle' ? (
            <p className="mt-3 text-center text-xs text-muted">
              {!addressValid
                ? 'Complete the delivery address to continue.'
                : !quote
                  ? 'Enter your pincode to see shipping.'
                  : null}
            </p>
          ) : null}

          <p className="mt-4 text-center text-xs leading-relaxed text-muted">
            Secure payment by UPI, card, netbanking or wallet through Razorpay. We never
            see or store your card details.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ field */

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  type = 'text',
  placeholder,
  autoComplete,
  inputMode,
  required = false,
  className = '',
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string | undefined;
  hint?: string | undefined;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email';
  required?: boolean;
  className?: string;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="aw-label">
        {label} {required ? <span className="text-accent">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required}
        className={`aw-field ${error ? 'aw-field-error' : ''}`}
      />
      {error ? (
        <p id={`${id}-error`} className="aw-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="aw-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
