import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/api';
import { fetchAllProductSlugs } from '@/lib/data';

/**
 * XML sitemap.
 *
 * Product URLs are pulled from the API. fetchAllProductSlugs() returns an empty
 * array rather than throwing if the API is unreachable, so a brief outage
 * yields a sitemap of the static pages instead of a failed build.
 *
 * Cart, checkout, order and admin pages are deliberately absent — they are
 * per-shopper and are marked noindex in their own metadata.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/shop`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITE_URL}/track`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${SITE_URL}/policies/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/policies/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/policies/refund`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/policies/shipping`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const slugs = await fetchAllProductSlugs();

  const productRoutes: MetadataRoute.Sitemap = slugs.map(({ slug, updatedAt }) => ({
    url: `${SITE_URL}/product/${slug}`,
    lastModified: updatedAt ? new Date(updatedAt) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...productRoutes];
}
