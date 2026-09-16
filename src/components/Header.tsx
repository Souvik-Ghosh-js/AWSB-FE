'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getCart, subscribeToCart } from '@/lib/cart';
import { NAV_LINKS, SHOP } from '@/lib/shop';
import { Logo } from './Logo';

/**
 * Site header.
 *
 * A client component because it reflects cart state and the mobile menu. The
 * catalogue pages beneath it stay server-rendered and indexable — only this
 * shell hydrates.
 */
export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the drawer whenever the route changes, or a shopper tapping a link
  // lands on the new page with the menu still covering it.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll behind the open drawer.
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      {/* Announcement bar. The one place shipping is advertised sitewide.
          The full sentence does not fit on a phone — it used to be clipped
          mid-word ("Delivered a…"), so the middle claim is dropped at small
          widths rather than truncated. */}
      <div className="bg-brand-deep text-[#e8e7f3]">
        <div className="aw-container flex min-h-9 items-center justify-center py-2 text-center">
          <p className="text-2xs tracking-[0.06em] sm:text-xs">
            Hand-decanted in Rajarhat
            <span className="hidden sm:inline"> · Free of alcohol</span>
            <span aria-hidden="true"> · </span>
            Delivered across India
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] backdrop-blur-md">
        <div className="aw-container flex h-16 items-center justify-between gap-4 sm:h-20">
          <Link href="/" aria-label={`${SHOP.name} — home`} className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    data-active={pathname.startsWith(link.href)}
                    className="aw-link-underline text-[0.8125rem] tracking-[0.06em] text-ink transition-colors hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Search is the fastest way into an 83-item catalogue; it sits in
                the header on every page, not only on the shop. */}
            <form action="/shop" method="get" role="search" className="hidden md:block">
              <label htmlFor="header-search" className="sr-only">
                Search attars
              </label>
              <input
                id="header-search"
                name="search"
                type="search"
                placeholder="Search attars…"
                className="aw-field h-10 w-44 rounded-full px-4 py-0 text-sm lg:w-56"
              />
            </form>
            <Link
              href="/shop"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand md:hidden"
            >
              <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="5.4" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13.2 13.2 17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </Link>
            <CartButton />

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className="flex h-10 w-10 items-center justify-center text-ink transition-colors hover:text-brand lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                {menuOpen ? (
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                ) : (
                  <>
                    <path d="M3 7h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    <path d="M3 17h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-ink)_38%,transparent)]"
          />
          <div
            id="mobile-menu"
            className="absolute inset-y-0 right-0 flex w-[min(20rem,86vw)] flex-col bg-bg shadow-[var(--shadow-raised)]"
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <span className="aw-eyebrow">Menu</span>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center text-ink"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-7">
              <ul className="space-y-1">
                {[{ href: '/', label: 'Home' }, ...NAV_LINKS].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block border-b border-line py-3.5 font-[family-name:var(--font-display)] text-xl text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <p className="aw-eyebrow mb-3">Contact</p>
                <a
                  href={`tel:+91${SHOP.primaryPhone}`}
                  className="block text-sm text-ink transition-colors hover:text-brand"
                >
                  +91 {SHOP.primaryPhone}
                </a>
                <a
                  href={`mailto:${SHOP.email}`}
                  className="mt-1.5 block text-sm break-all text-ink transition-colors hover:text-brand"
                >
                  {SHOP.email}
                </a>
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}

/**
 * Cart button with a live count.
 *
 * The count renders as null on the server and on the first client paint, then
 * fills in after mount. That is deliberate: localStorage does not exist during
 * SSR, so rendering a count immediately would cause a hydration mismatch.
 */
function CartButton() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setCount(getCart().itemCount);
    sync();
    return subscribeToCart(sync);
  }, []);

  return (
    <Link
      href="/cart"
      className="relative flex h-10 items-center gap-2 px-2.5 text-ink transition-colors hover:text-brand sm:px-3"
      aria-label={count ? `Cart, ${count} items` : 'Cart'}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path
          d="M6.5 8h11l-1 11.5a1.6 1.6 0 0 1-1.6 1.5H9.1a1.6 1.6 0 0 1-1.6-1.5z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path
          d="M9.4 8V6.2a2.6 2.6 0 1 1 5.2 0V8"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
      <span className="hidden text-[0.8125rem] tracking-[0.06em] sm:inline">Cart</span>
      {count && count > 0 ? (
        <span className="absolute top-0.5 right-0 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-medium text-[#2a2008] sm:right-0.5">
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  );
}
