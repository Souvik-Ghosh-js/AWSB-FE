/**
 * The cart, in localStorage.
 *
 * Three rules this module exists to enforce:
 *
 * 1. SSR SAFETY. These functions run during server rendering too, where
 *    `window` does not exist. Every entry point checks for it and returns an
 *    empty cart rather than throwing — a ReferenceError here would blank the
 *    whole page.
 *
 * 2. EVERY STORAGE ACCESS IS GUARDED. Safari in private mode throws on
 *    setItem; a user can disable site data entirely; the quota can be full.
 *    None of that may break the shop, so every read and write is in a
 *    try/catch and degrades to an in-memory cart for the session.
 *
 * 3. THE STORED PRICE IS A DISPLAY CACHE, NOT THE TRUTH. Anyone can edit
 *    localStorage. Prices shown from here are provisional; /cart/validate and
 *    /checkout/session re-price server-side, and the server's figure is the
 *    one charged.
 */

import type { CartLineInput, ProductDetail, Variant } from './types';

const STORAGE_KEY = 'awsb.cart.v1';

/** Guards against a fat-fingered quantity field and absurd stock requests. */
export const MAX_QUANTITY_PER_LINE = 20;

export interface CartItem {
  variantId: number;
  productId: number;
  slug: string;
  name: string;
  sizeMl: number;
  sizeUnit: 'ml' | 'g' | 'sticks';
  sku: string;
  /** Display cache only — re-priced server-side before payment. */
  unitPricePaise: number;
  quantity: number;
  imageUrl: string | null;
  addedAt: number;
}

export interface Cart {
  items: CartItem[];
  /** Sum of the CACHED prices. Indicative until the server re-prices. */
  subtotalPaise: number;
  itemCount: number;
}

export const EMPTY_CART: Cart = Object.freeze({
  items: [],
  subtotalPaise: 0,
  itemCount: 0,
});

/**
 * Fallback store for when localStorage is unavailable (private browsing,
 * blocked site data). The cart then lives for the page session only, which is
 * far better than an "add to cart" button that appears to do nothing.
 */
let memoryFallback: CartItem[] | null = null;

/** The event other components listen on to stay in sync. */
export const CART_CHANGED_EVENT = 'awsb:cart-changed';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readRaw(): CartItem[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return memoryFallback ?? [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem).map(sanitise);
  } catch {
    // Corrupt JSON, blocked storage, or a SecurityError. Fall back rather
    // than letting the exception escape into a render.
    return memoryFallback ?? [];
  }
}

function writeRaw(items: CartItem[]): void {
  if (!isBrowser()) return;

  memoryFallback = items;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded or storage disabled. The in-memory copy above keeps the
    // cart working for this session.
  }

  try {
    window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
  } catch {
    // CustomEvent is unavailable in some embedded webviews; the cart still
    // functions, the badge simply refreshes on the next navigation.
  }
}

/** Validate a parsed object before trusting it as a cart line. */
function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.variantId === 'number' &&
    Number.isFinite(v.variantId) &&
    typeof v.quantity === 'number' &&
    typeof v.slug === 'string' &&
    typeof v.name === 'string'
  );
}

const SIZE_UNITS = new Set(['ml', 'g', 'sticks']);

/**
 * Clamp anything a hand-edited localStorage entry might contain — and, since
 * this field is new, backfill sizeUnit for a cart saved by an older build
 * that never wrote it at all.
 */
function sanitise(item: CartItem): CartItem {
  return {
    ...item,
    quantity: clampQuantity(item.quantity),
    unitPricePaise: Math.max(0, Math.round(Number(item.unitPricePaise) || 0)),
    sizeMl: Math.max(0, Math.round(Number(item.sizeMl) || 0)),
    sizeUnit: SIZE_UNITS.has(item.sizeUnit) ? item.sizeUnit : 'ml',
  };
}

function clampQuantity(qty: unknown): number {
  const n = Math.floor(Number(qty));
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, MAX_QUANTITY_PER_LINE);
}

function summarise(items: CartItem[]): Cart {
  let subtotalPaise = 0;
  let itemCount = 0;
  for (const item of items) {
    subtotalPaise += item.unitPricePaise * item.quantity;
    itemCount += item.quantity;
  }
  return { items, subtotalPaise, itemCount };
}

/* ------------------------------------------------------------------ API */

/** Current cart. Returns EMPTY_CART during SSR — never throws. */
export function getCart(): Cart {
  return summarise(readRaw());
}

/**
 * Add a variant. Adding a size already in the cart increases its quantity
 * rather than creating a second line — 3ml and 6ml of the same attar are
 * separate lines because they are separate variants.
 */
export function addToCart(
  product: Pick<ProductDetail, 'id' | 'slug' | 'name' | 'images'>,
  variant: Variant,
  quantity = 1
): Cart {
  const items = readRaw();
  const qty = clampQuantity(quantity);

  const existing = items.find((i) => i.variantId === variant.id);

  if (existing) {
    existing.quantity = clampQuantity(existing.quantity + qty);
    // Refresh the cached price so a stale localStorage entry does not show a
    // price from last month.
    existing.unitPricePaise = variant.pricePaise;
  } else {
    const primary =
      product.images?.find((img) => img.isPrimary) ?? product.images?.[0] ?? null;

    items.push({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sizeMl: variant.sizeMl,
      sizeUnit: variant.sizeUnit,
      sku: variant.sku,
      unitPricePaise: variant.pricePaise,
      quantity: qty,
      imageUrl: primary?.url ?? null,
      addedAt: Date.now(),
    });
  }

  writeRaw(items);
  return summarise(items);
}

export function updateQuantity(variantId: number, quantity: number): Cart {
  const items = readRaw();
  const qty = Math.floor(Number(quantity));

  if (!Number.isFinite(qty) || qty < 1) {
    return removeFromCart(variantId);
  }

  const line = items.find((i) => i.variantId === variantId);
  if (line) line.quantity = clampQuantity(qty);

  writeRaw(items);
  return summarise(items);
}

export function removeFromCart(variantId: number): Cart {
  const items = readRaw().filter((i) => i.variantId !== variantId);
  writeRaw(items);
  return summarise(items);
}

/** Emptied after a successful payment, and by the shopper from /cart. */
export function clearCart(): Cart {
  if (isBrowser()) {
    memoryFallback = [];
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing to do — the memory copy is already cleared.
    }
    try {
      window.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
    } catch {
      // Non-fatal.
    }
  }
  return { ...EMPTY_CART, items: [] };
}

/**
 * Reduce the cart to what the API is allowed to trust: variant ids and
 * quantities. Prices are deliberately NOT sent — the server looks them up.
 */
export function toCartLines(cart: Cart = getCart()): CartLineInput[] {
  return cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
}

/**
 * Apply the server's re-priced view back onto the stored cart, so the shopper
 * sees the corrected figures and stale prices stop propagating.
 */
export function reconcileCart(
  validated: { variantId: number; unitPricePaise: number; availableQuantity: number }[]
): Cart {
  const byId = new Map(validated.map((v) => [v.variantId, v]));

  const items = readRaw()
    // A variant the server did not return no longer exists or is disabled.
    .filter((item) => byId.has(item.variantId))
    .map((item) => {
      const server = byId.get(item.variantId);
      if (!server) return item;
      return {
        ...item,
        unitPricePaise: server.unitPricePaise,
        quantity: clampQuantity(Math.min(item.quantity, server.availableQuantity)),
      };
    })
    // availableQuantity of 0 means it sold out while the cart sat open.
    .filter((item) => (byId.get(item.variantId)?.availableQuantity ?? 0) > 0);

  writeRaw(items);
  return summarise(items);
}

/** Quantity of one variant, for showing "2 in cart" on the product page. */
export function quantityOf(variantId: number): number {
  return readRaw().find((i) => i.variantId === variantId)?.quantity ?? 0;
}

/**
 * Subscribe to cart changes. Listens for both the in-tab custom event and the
 * native `storage` event, so the badge stays correct when the shopper has the
 * shop open in two tabs.
 */
export function subscribeToCart(listener: () => void): () => void {
  if (!isBrowser()) return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) listener();
  };

  window.addEventListener(CART_CHANGED_EVENT, listener);
  window.addEventListener('storage', onStorage);

  return () => {
    window.removeEventListener(CART_CHANGED_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
