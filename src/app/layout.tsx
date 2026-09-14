import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';

import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { SITE_URL } from '@/lib/api';
import { SHOP } from '@/lib/shop';
import '@/styles/globals.css';

/**
 * Cormorant Garamond for display, Inter for UI — a classical serif against a
 * quiet humanist sans, as the design direction specifies.
 *
 * `display: 'swap'` so a slow font never blocks first paint, and the CSS
 * variables are consumed by --font-display / --font-sans in globals.css.
 */
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
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
  themeColor: '#14432A',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        {/* Keyboard users should not have to tab through the whole nav to
            reach a long checkout form. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[60] focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-[#f7f4ea]"
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
