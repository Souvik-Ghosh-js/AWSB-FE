import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/api';

/**
 * robots.txt.
 *
 * Cart, checkout and per-order pages are disallowed: none of them is useful in
 * an index, and order pages contain a customer's address. Those routes also
 * send their own noindex metadata — robots.txt asks crawlers not to fetch, the
 * meta tag stops anything that does from indexing.
 *
 * The admin panel is not listed because it is not part of this app at all. It
 * is a separate deployment on admin.<domain>, with its own robots rules.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/cart', '/checkout', '/order/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
