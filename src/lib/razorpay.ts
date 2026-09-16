/**
 * Razorpay Checkout loader and typings.
 *
 * WHAT THE BROWSER IS TRUSTED WITH: the publishable key id and an order_id
 * minted server-side. Nothing else. The key SECRET never reaches this app —
 * it signs and verifies on the API, and the authoritative confirmation is the
 * `order.paid` webhook, not anything that happens in this file.
 *
 * NO COD: only Razorpay's own methods (UPI, cards, netbanking, wallets) are
 * offered. There is no cash-on-delivery path anywhere in this codebase.
 */

const CHECKOUT_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/** The three fields Razorpay hands the browser handler on success. */
export interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayFailureResponse {
  error: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: { order_id?: string; payment_id?: string };
  };
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string; backdrop_color?: string };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    confirm_close?: boolean;
    backdropclose?: boolean;
  };
  retry?: { enabled?: boolean };
}

export interface RazorpayInstance {
  open: () => void;
  close: () => void;
  on: (
    event: 'payment.failed',
    handler: (response: RazorpayFailureResponse) => void
  ) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/**
 * Load checkout.js once and resolve when `window.Razorpay` exists.
 *
 * Idempotent: repeated calls (a retry after a failed payment, a second
 * checkout attempt) reuse the in-flight or already-resolved promise rather
 * than injecting the script twice.
 */
let loaderPromise: Promise<void> | null = null;

export function loadRazorpayCheckout(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay Checkout can only load in the browser.'));
  }

  if (window.Razorpay) return Promise.resolve();
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT_URL}"]`
    );

    const onLoad = () => {
      if (window.Razorpay) resolve();
      else reject(new Error('Razorpay Checkout loaded but did not initialise.'));
    };

    const onError = () => {
      // Allow a later retry rather than caching the failure forever — this
      // fires on a flaky connection or a blocked CDN, both of which recover.
      loaderPromise = null;
      reject(
        new Error(
          'Could not load the payment window. Check your connection, or disable any ad blocker for this site.'
        )
      );
    };

    if (existing) {
      existing.addEventListener('load', onLoad, { once: true });
      existing.addEventListener('error', onError, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT_URL;
    script.async = true;
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    document.body.appendChild(script);
  });

  return loaderPromise;
}

/** Brand theme for the Razorpay modal — deep forest, matching the site. */
export const RAZORPAY_THEME = {
  color: '#1c1d45',
  backdrop_color: 'rgba(31, 42, 36, 0.72)',
} as const;

/**
 * Turn a Razorpay failure payload into something a shopper can act on.
 * The raw `description` is often internal ("BAD_REQUEST_ERROR"), so the
 * common codes are mapped to plain English.
 */
export function describePaymentFailure(response: RazorpayFailureResponse): string {
  const { code, description, reason } = response.error ?? {};

  if (reason === 'payment_cancelled') {
    return 'The payment was cancelled. Your order is still held — you can try again.';
  }

  switch (code) {
    case 'GATEWAY_ERROR':
      return 'Your bank or UPI app could not complete the payment. Please try again, or use a different method.';
    case 'NETWORK_ERROR':
      return 'The payment could not be completed because the connection dropped. Please try again.';
    case 'BAD_REQUEST_ERROR':
      return description || 'The payment details were not accepted. Please check and try again.';
    default:
      return (
        description ||
        'The payment did not go through. No money has been taken — please try again.'
      );
  }
}
