/**
 * Typed fetch wrapper for the Express API.
 *
 * The frontend NEVER connects to MySQL and NEVER holds a Razorpay secret. Its
 * only backend is this HTTPS API. Everything the browser is allowed to know is
 * a NEXT_PUBLIC_ variable.
 *
 * Two callers, two behaviours:
 *   - Server components call these from the Node runtime and pass caching
 *     hints, so catalogue pages are statically indexable.
 *   - Client components call the same functions in the browser; the admin
 *     helpers attach the JWT from the auth module.
 */

import type {
  AdminDashboard,
  AdminLoginResult,
  AdminOrderDetail,
  AdminOrderSummary,
  AdminProduct,
  AdminUser,
  AdminUserInput,
  ApiErrorBody,
  AwbScanResult,
  CartLineInput,
  CartValidation,
  Category,
  CheckoutSession,
  CheckoutSessionInput,
  CheckoutVerifyResult,
  Coupon,
  CouponPreview,
  Courier,
  CourierInput,
  Feedback,
  FeedbackInput,
  InventoryMovement,
  LowStockRow,
  Order,
  Paginated,
  PincodeLookup,
  ProductDetail,
  ProductInput,
  ProductSummary,
  RazorpayVerifyInput,
  Review,
  ReviewInput,
  ReviewStatus,
  SettingEntry,
  ShipOrderInput,
  ShippingQuote,
} from './types';

/* --------------------------------------------------------------- config */

/**
 * Base URL including /api/v1. Falls back to localhost so a fresh clone runs
 * without a .env.local; a production build without the variable set is a
 * misconfiguration worth noticing in the console rather than failing silently.
 */
export const API_BASE_URL: string = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const RAZORPAY_KEY_ID: string = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

/** Local visual development against src/lib/mock-data.ts. Never on in prod. */
export const USE_MOCKS: boolean = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

/* ---------------------------------------------------------------- error */

/**
 * A failed API call. Carries the HTTP status and the API's own error code so
 * callers can distinguish "not found" from "the API is down" — the difference
 * between a 404 page and an "unavailable, try again" panel.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly fieldErrors: Record<string, string | string[]> | undefined;
  /** True when the request never reached the API (DNS, TLS, offline, timeout). */
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    options: {
      code?: string;
      fieldErrors?: Record<string, string | string[]>;
      isNetworkError?: boolean;
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = options.code;
    this.fieldErrors = options.fieldErrors;
    this.isNetworkError = options.isNetworkError ?? false;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }

  /** Safe to show a shopper: never leaks a stack or an internal code. */
  get friendlyMessage(): string {
    if (this.isNetworkError) {
      return 'We could not reach the store right now. Please check your connection and try again.';
    }
    if (this.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (this.status >= 500) {
      return 'Something went wrong at our end. Please try again in a moment.';
    }
    return this.message;
  }
}

/* -------------------------------------------------------------- request */

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Bearer token — admin calls only. */
  token?: string | null;
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Seconds. Server components use this for ISR on catalogue pages. */
  revalidate?: number | false;
  tags?: string[];
  /** Abort after this many ms so a hung API cannot hang a page render. */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

function buildUrl(
  path: string,
  query?: RequestOptions['query']
): string {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * The single place every API call goes through.
 *
 * Note the deliberate absence of `credentials: 'include'`: the API is on a
 * different origin and auth is a bearer token, not a cookie, so sending
 * credentials would only widen the CORS surface for no benefit.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    token,
    query,
    revalidate,
    tags,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    headers,
    ...rest
  } = options;

  const url = buildUrl(path, query);

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  let payload: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      // Never set Content-Type for FormData — the boundary must be generated
      // by the runtime.
      payload = body;
    } else {
      finalHeaders['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
  }

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  // AbortSignal.timeout is available in Node 18+ and every target browser,
  // but guard anyway so an older runtime degrades to "no timeout" rather than
  // throwing at module load.
  const signal =
    rest.signal ??
    (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal
      ? AbortSignal.timeout(timeoutMs)
      : undefined);

  const init: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    ...rest,
    method,
    headers: finalHeaders,
    signal,
  };

  if (payload !== undefined) init.body = payload;

  // Caching: opt in explicitly. Anything money- or account-related must never
  // be cached, so the default when no revalidate is given is no-store.
  if (revalidate !== undefined || tags) {
    init.next = {};
    if (revalidate !== undefined) init.next.revalidate = revalidate;
    if (tags) init.next.tags = tags;
  } else if (method === 'GET') {
    init.cache = 'no-store';
  }

  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    const aborted = err instanceof Error && err.name === 'TimeoutError';
    throw new ApiError(
      aborted ? 'The store took too long to respond.' : 'Could not reach the store.',
      0,
      { isNetworkError: true, code: aborted ? 'TIMEOUT' : 'NETWORK' }
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // A non-JSON body from a proxy or an nginx error page. Keep the raw text
      // for the message but do not pretend it parsed.
      if (!response.ok) {
        throw new ApiError(
          `Unexpected response from the store (HTTP ${response.status}).`,
          response.status,
          { code: 'BAD_RESPONSE' }
        );
      }
    }
  }

  if (!response.ok) {
    const errBody = (parsed ?? {}) as ApiErrorBody;
    throw new ApiError(
      errBody.message || `Request failed (HTTP ${response.status}).`,
      response.status,
      { code: errBody.code, fieldErrors: errBody.errors }
    );
  }

  return unwrap<T>(parsed);
}

/**
 * The API may wrap payloads in `{ data: … }` or return them bare. Accepting
 * both keeps the client working either way rather than silently rendering
 * `undefined` if the envelope convention shifts.
 */
function unwrap<T>(parsed: unknown): T {
  if (
    parsed &&
    typeof parsed === 'object' &&
    'data' in parsed &&
    Object.keys(parsed).length <= 2
  ) {
    return (parsed as { data: T }).data;
  }
  return parsed as T;
}

/** Swallow a 404 into null. Used where "missing" is an expected outcome. */
export async function apiRequestOrNull<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T | null> {
  try {
    return await apiRequest<T>(path, options);
  } catch (err) {
    if (err instanceof ApiError && err.isNotFound) return null;
    throw err;
  }
}

/* ------------------------------------------------------- public: catalogue */

/** Catalogue pages are indexable, so they are rendered on the server and ISR'd. */
const CATALOGUE_REVALIDATE = 300;

export interface ProductQuery {
  category?: string;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
  page?: number;
  limit?: number;
}

export function getProducts(query: ProductQuery = {}): Promise<Paginated<ProductSummary>> {
  return apiRequest<Paginated<ProductSummary>>('/products', {
    query: { ...query },
    revalidate: CATALOGUE_REVALIDATE,
    tags: ['products'],
  });
}

export function getProduct(slug: string): Promise<ProductDetail | null> {
  return apiRequestOrNull<ProductDetail>(`/products/${encodeURIComponent(slug)}`, {
    revalidate: CATALOGUE_REVALIDATE,
    tags: ['products', `product:${slug}`],
  });
}

export async function getCategories(): Promise<Category[]> {
  // The API answers {items: [...]}, not a bare array. Typing this as
  // Promise<Category[]> made TypeScript agree with a lie, and the mock data
  // (which IS an array) hid it locally — the first real build crashed with
  // "a.slice is not a function". Unwrap explicitly, and tolerate either shape
  // so a future API change cannot take the homepage down.
  const body = await apiRequest<Category[] | { items: Category[] }>('/categories', {
    revalidate: CATALOGUE_REVALIDATE,
    tags: ['categories'],
  });

  if (Array.isArray(body)) return body;
  return Array.isArray(body?.items) ? body.items : [];
}

/** Featured attars for the home page. */
export async function getFeaturedProducts(limit = 6): Promise<ProductSummary[]> {
  const page = await apiRequest<Paginated<ProductSummary>>('/products', {
    query: { featured: true, limit },
    revalidate: CATALOGUE_REVALIDATE,
    tags: ['products'],
  });
  return page.items ?? [];
}

/* ------------------------------------------------------------ public: cart */

/**
 * Re-price and stock-check the cart. The server is the only authority on
 * price — localStorage is shopper-editable and must never be trusted.
 */
export async function validateCart(items: CartLineInput[]): Promise<CartValidation> {
  const raw = await apiRequest<Record<string, unknown>>('/cart/validate', {
    method: 'POST',
    body: { items },
  });
  return normaliseCartValidation(raw);
}

type ValidatedLine = CartValidation['items'][number];
type Adjustment = CartValidation['adjustments'][number];

const ISSUE_MESSAGE: Record<string, { type: Adjustment['type']; text: (name: string) => string }> = {
  unavailable: { type: 'removed', text: (n) => `${n} is no longer available and was removed.` },
  out_of_stock: { type: 'out_of_stock', text: (n) => `${n} has sold out and was removed.` },
  quantity_reduced: { type: 'quantity_clamped', text: (n) => `Only limited stock of ${n} is left, so the quantity was reduced.` },
};

/**
 * The live API answers POST /cart/validate with MySQL's shapes leaking through:
 * `variantId` is a string ("247"), the stock field is `availableQty`, and
 * problems arrive as per-line `issues: ['out_of_stock']` plus a top-level
 * `hasIssues` rather than an `adjustments` list. The cart code keys a Map by
 * numeric variantId and reads `availableQuantity`, so before this normaliser
 * every line looked sold out and the cart emptied itself on open. Verified
 * against the live server on 2026-09-16.
 */
function normaliseCartValidation(raw: Record<string, unknown>): CartValidation {
  const rawItems = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];
  const adjustments: Adjustment[] = Array.isArray(raw.adjustments)
    ? (raw.adjustments as Adjustment[]).map((a) => ({ ...a, variantId: Number(a.variantId) }))
    : [];

  const lines: ValidatedLine[] = rawItems.map((i) => {
    const variantId = Number(i.variantId);
    const name = String(i.productName ?? 'An item');
    const sizeMl = Number(i.sizeMl ?? 0);
    const label = sizeMl ? `${name} ${sizeMl}ml` : name;
    const availableQuantity = Number(i.availableQuantity ?? i.availableQty ?? 0);
    const issues = Array.isArray(i.issues) ? (i.issues as string[]) : [];

    for (const code of issues) {
      const known = ISSUE_MESSAGE[code];
      if (known && !adjustments.some((a) => a.variantId === variantId && a.type === known.type)) {
        adjustments.push({ variantId, type: known.type, message: known.text(label) });
      }
    }

    return {
      variantId,
      productId: Number(i.productId ?? 0),
      productName: name,
      productSlug: String(i.productSlug ?? ''),
      sizeMl,
      sku: String(i.sku ?? ''),
      unitPricePaise: Number(i.unitPricePaise ?? 0),
      quantity: Number(i.quantity ?? 0),
      availableQuantity,
      inStock: availableQuantity > 0,
      lineTotalPaise: Number(i.lineTotalPaise ?? 0),
      imageUrl: typeof i.imageUrl === 'string' ? i.imageUrl : null,
    };
  });

  return {
    items: lines,
    subtotalPaise: Number(raw.subtotalPaise ?? 0),
    adjustments,
  };
}

export function validateCoupon(
  code: string,
  items: CartLineInput[]
): Promise<CouponPreview> {
  return apiRequest<CouponPreview>('/coupons/validate', {
    method: 'POST',
    body: { code, items },
  });
}

/* -------------------------------------------------------- public: shipping */

/**
 * Live shipping quote driven by the pincode: ₹49 for Kolkata 700001-700199,
 * ₹99 elsewhere. Shown in the order summary before payment.
 */
export function getShippingQuote(
  pincode: string,
  subtotalPaise: number
): Promise<ShippingQuote> {
  return apiRequest<ShippingQuote>('/shipping/quote', {
    query: { pincode, subtotal_paise: subtotalPaise },
  });
}

/** Pincode -> city/district/state, which autofills the address form. */
export function lookupPincode(pincode: string): Promise<PincodeLookup | null> {
  return apiRequestOrNull<PincodeLookup>('/shipping/pincode', {
    query: { pincode },
  });
}

/* -------------------------------------------------------- public: checkout */

export function createCheckoutSession(
  input: CheckoutSessionInput
): Promise<CheckoutSession> {
  return apiRequest<CheckoutSession>('/checkout/session', {
    method: 'POST',
    body: input,
  });
}

/**
 * Hand the three Razorpay fields to the API for signature verification.
 * This is only a fast provisional confirmation — the authoritative fulfilment
 * trigger is the order.paid webhook, server-side.
 */
export function verifyCheckout(
  input: RazorpayVerifyInput
): Promise<CheckoutVerifyResult> {
  return apiRequest<CheckoutVerifyResult>('/checkout/verify', {
    method: 'POST',
    body: input,
  });
}

/* ---------------------------------------------------------- public: orders */

/**
 * Guest order lookup. Gated on BOTH the order number and the email the parcel
 * is going to — order numbers are sequential and therefore guessable, so the
 * matching email is what stops one customer reading another's address.
 */
export function trackOrder(orderNumber: string, email: string): Promise<Order | null> {
  return apiRequestOrNull<Order>('/orders/track', {
    query: { order_number: orderNumber, email },
  });
}

/* ------------------------------------------------ public: reviews & contact */

export function submitReview(input: ReviewInput): Promise<{ status: ReviewStatus }> {
  return apiRequest<{ status: ReviewStatus }>('/reviews', {
    method: 'POST',
    body: input,
  });
}

export function submitFeedback(input: FeedbackInput): Promise<{ id: number }> {
  return apiRequest<{ id: number }>('/feedback', {
    method: 'POST',
    body: input,
  });
}

/* The admin API client lives in the separate admin/ app, not here.
   The storefront must never ship admin code to customers. */

