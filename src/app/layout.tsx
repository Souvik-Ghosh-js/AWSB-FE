import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { SITE_URL } from '@/lib/api';
import { SHOP } from '@/lib/shop';
import '@/styles/globals.css';

/**
 * Fraunces for display, Inter for UI.
 *
 * Fraunces replaced Cormorant Garamond: Cormorant is a Garamond revival with
 * very thin strokes, and at the weights it was used here (300-400) headings
 * got LIGHTER as they got bigger, so nothing on the page carried any weight.
 * Fraunces is a variable "soft serif" with real mass at 600-700 and a slight
 * wonk that reads warm rather than corporate — heritage, but contemporary.
 *
 * `opsz` is the optical-size axis: at display sizes it sharpens the contrast
 * and tightens the joins, which is exactly what large product names want.
 *
 * `display: 'swap'` so a slow font never blocks first paint, and the CSS
 * variables are consumed by --font-display / --font-sans in globals.css.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  // No `weight` here on purpose: Fraunces is a variable font, and next/font
  // rejects `axes` unless the weight axis is left variable ("Axes can only be
  // defined for variable fonts when the weight property is nonexistent or set
  // to `variable`"). Omitting it ships the full 100-900 range, which is what
  // the headings want anyway — they set weight 600 in CSS.
  axes: ['opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SHOP.name} — Attar & Perfume Oils, Kolkata`,
    // Every page appends its own name; the house name stays on the right.
    template: `%s · ${SHOP.shortName}`,
  },
  description: SHOP.description,
  applicationName: SHOP.name,
  keywords: [
    'attar',
    'perfume oil',
    'ittar',
    'oud',
    'alcohol-free perfume',
    'Kolkata attar',
    'Rajarhat',
  ],
  authors: [{ name: SHOP.name }],
  openGraph: {
    type: 'website',
    siteName: SHOP.name,
    locale: 'en_IN',
    url: SITE_URL,
    title: `${SHOP.name} — Attar & Perfume Oils`,
    description: SHOP.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SHOP.name} — Attar & Perfume Oils`,
    description: SHOP.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3a0f18',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {/* Keyboard users should not have to tab through the whole nav to
            reach a long checkout form. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>

        <div className="flex min-h-screen flex-col">
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
