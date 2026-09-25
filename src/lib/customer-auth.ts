'use client';

/**
 * Session storage for the customer JWT (email-OTP sign-in).
 *
 * localStorage, not sessionStorage: a shopper checking their order history is
 * expected to stay signed in across visits, unlike admin staff on a shared
 * shop device. The token only ever unlocks /me and /me/orders — order
 * history, no payment method, no address book — so the exposure from a
 * scripting bug is the same low-value read as a guest order-tracking lookup
 * already allows.
 */

const TOKEN_KEY = 'awsb.customer.token';

export interface CustomerSession {
  id: number;
  email: string;
}

type Listener = () => void;
const listeners = new Set<Listener>();

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* A session that cannot persist still works until the tab closes. */
  }
}

function safeRemove(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function decodeJwt(token: string): { exp?: number; sub?: string; email?: string } | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = safeGet(TOKEN_KEY);
  if (!token) return null;

  const payload = decodeJwt(token);
  if (payload?.exp && payload.exp * 1000 < Date.now()) {
    clearCustomerSession();
    return null;
  }
  return token;
}

export function getCustomer(): CustomerSession | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwt(token);
  if (!payload?.sub || !payload.email) return null;
  return { id: Number(payload.sub), email: payload.email };
}

export function saveCustomerSession(token: string) {
  safeSet(TOKEN_KEY, token);
  listeners.forEach((fn) => fn());
}

export function clearCustomerSession() {
  safeRemove(TOKEN_KEY);
  listeners.forEach((fn) => fn());
}

/** Lets the header react when a session appears or disappears. */
export function subscribeToCustomerSession(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
