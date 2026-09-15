import Link from 'next/link';

import { NAV_LINKS, POLICY_LINKS, SHOP } from '@/lib/shop';
import { Logo } from './Logo';

/**
 * Site footer.
 *
 * Carries the real shop address and the four policy links, which Razorpay
 * requires to be visibly reachable from every page before international cards
 * can be enabled.
 *
 * No GSTIN appears anywhere — the shop is not GST registered.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-line bg-surface-alt sm:mt-32">
      <div className="aw-container py-14 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* House */}
          <div className="lg:col-span-4">
            <Logo />
            <p className="mt-6 max-w-xs text-[0.8125rem] leading-relaxed text-muted">
              An attar house in Rajarhat, decanting alcohol-free perfume oils by hand in
              3ml, 6ml and 12ml — oud, rose, musk and amber, in the Bengal tradition.
            </p>
          </div>

          {/* Shop */}
          <div className="lg:col-span-2">
            <p className="aw-eyebrow mb-4">Shop</p>
            <ul className="space-y-2.5">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.8125rem] text-ink transition-colors hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies — required by Razorpay */}
          <div className="lg:col-span-3">
            <p className="aw-eyebrow mb-4">Policies</p>
            <ul className="space-y-2.5">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.8125rem] text-ink transition-colors hover:text-brand"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <p className="aw-eyebrow mb-4">Visit &amp; Contact</p>
            <address className="text-[0.8125rem] leading-relaxed text-muted not-italic">
              {SHOP.address.line1}, {SHOP.address.line2}
              <br />
              {SHOP.address.city}, {SHOP.address.state} {SHOP.address.pincode}
              <br />
              {SHOP.address.country}
            </address>

            <div className="mt-4 space-y-1.5">
              {SHOP.phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:+91${phone}`}
                  className="block text-[0.8125rem] text-ink transition-colors hover:text-brand"
                >
                  +91 {phone}
                </a>
              ))}
              <a
                href={`mailto:${SHOP.email}`}
                className="block text-[0.8125rem] break-all text-ink transition-colors hover:text-brand"
              >
                {SHOP.email}
              </a>
            </div>

            <p className="mt-4 text-xs text-muted">{SHOP.hours}</p>
          </div>
        </div>

        <hr className="aw-rule mt-14" />

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            © {year} {SHOP.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted">
            Secure payments by Razorpay · UPI, cards and netbanking accepted
          </p>
        </div>
      </div>
    </footer>
  );
}
