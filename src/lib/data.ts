/**
 * The data layer server components actually call.
 *
 * Two jobs, both of which exist because the API is a separate service that may
 * be unreachable:
 *
 * 1. NEVER THROW INTO A RENDER. Every function returns a discriminated result
 *    ({ ok: true, data } | { ok: false, error }) so a page can show an error
 *    panel inside its normal layout instead of collapsing to the 500 page. A
 *    dead API should degrade the catalogue, not take the whole shop down.
 *
 * 2. MOCK FALLBACK for local visual development. With NEXT_PUBLIC_USE_MOCKS=true
 *    (or when the API is unreachable in development) pages render from
 *    mock-data.ts so the design can be built before the API exists. This never
 *    activates in production: a production build with a failing API shows the
 *    error state, because silently serving fake products and fake prices to a
 *    real shopper would be far worse than an honest error.
 */

import { ApiError, USE_MOCKS, getCategories, getProduct, getProducts } from './api';
import {
  mockCategories,
  mockProductBySlug,
  mockProductSummaries,
  mockProducts,
  toSummary,
} from './mock-data';
import type { Category, Paginated, ProductDetail, ProductSummary } from './types';
import type { ProductQuery } from './api';

export type Result<T> =
  | { ok: true; data: T; isMock?: boolean }
  | { ok: false; error: string; status: number };

const IS_DEV = process.env.NODE_ENV !== 'production';

/**
 * Should this failure fall back to mock data?
 *
 * Only in development, and only when the API could not be reached at all. A
 * 404 or a 500 from a live API is real information and must not be papered
 * over with invented products.
 */
function shouldFallBack(err: unknown): boolean {
  if (USE_MOCKS) return true;
  if (!IS_DEV) return false;
  return err instanceof ApiError && err.isNetworkError;
}

function toError(err: unknown): { ok: false; error: string; status: number } {
  if (err instanceof ApiError) {
    return { ok: false, error: err.friendlyMessage, status: err.status };
  }
  return {
    ok: false,
    error: 'Something went wrong loading this page.',
    status: 500,
  };
}

/* ------------------------------------------------------------ catalogue */

/** Apply filtering/sorting/pagination to the mock set, mirroring the API. */
function mockProductPage(query: ProductQuery): Paginated<ProductSummary> {
  let items = [...mockProductSummaries];

  if (query.category) {
    const slug = query.category;
    const ids = new Set(
      mockProducts
        .filter((p) => (p.categories ?? []).some((c) => c.slug === slug))
        .map((p) => p.id)
    );
    items = items.filter((p) => ids.has(p.id));
  }

  if (query.search) {
    const q = query.search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.tagline ?? '').toLowerCase().includes(q) ||
        (p.scentFamily ?? '').toLowerCase().includes(q)
    );
  }

  switch (query.sort) {
    case 'price_asc':
      items.sort((a, b) => (a.fromPricePaise ?? a.minPricePaise ?? 0) - (b.fromPricePaise ?? b.minPricePaise ?? 0));
      break;
    case 'price_desc':
      items.sort((a, b) => (b.fromPricePaise ?? b.minPricePaise ?? 0) - (a.fromPricePaise ?? a.minPricePaise ?? 0));
      break;
    case 'name':
      items.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      items.sort((a, b) => b.id - a.id);
  }

  const limit = query.limit ?? 24;
  const page = query.page ?? 1;
  const total = items.length;

  return {
    items: items.slice((page - 1) * limit, page * limit),
    page,
    limit,
    total,
    totalPages: limit === 0 ? 0 : Math.ceil(total / limit),
  };
}

export async function fetchProducts(
  query: ProductQuery = {}
): Promise<Result<Paginated<ProductSummary>>> {
  if (USE_MOCKS) {
    return { ok: true, data: mockProductPage(query), isMock: true };
  }

  try {
    return { ok: true, data: await getProducts(query) };
  } catch (err) {
    if (shouldFallBack(err)) {
      return { ok: true, data: mockProductPage(query), isMock: true };
    }
    return toError(err);
  }
}

/**
 * A product, or null when it genuinely does not exist (so the page can call
 * notFound()). An API failure is distinct from a missing product and returns
 * ok:false instead.
 */
export async function fetchProduct(slug: string): Promise<Result<ProductDetail | null>> {
  if (USE_MOCKS) {
    return { ok: true, data: mockProductBySlug(slug), isMock: true };
  }

  try {
    return { ok: true, data: await getProduct(slug) };
  } catch (err) {
    if (shouldFallBack(err)) {
      return { ok: true, data: mockProductBySlug(slug), isMock: true };
    }
    return toError(err);
  }
}

export async function fetchCategories(): Promise<Result<Category[]>> {
  if (USE_MOCKS) {
    return { ok: true, data: mockCategories, isMock: true };
  }

  try {
    return { ok: true, data: await getCategories() };
  } catch (err) {
    if (shouldFallBack(err)) {
      return { ok: true, data: mockCategories, isMock: true };
    }
    return toError(err);
  }
}

export async function fetchFeatured(limit = 4): Promise<Result<ProductSummary[]>> {
  const result = await fetchProducts({ limit: 24 });
  if (!result.ok) return result;

  const featured = result.data.items.filter((p) => p.isFeatured);
  const items = (featured.length > 0 ? featured : result.data.items).slice(0, limit);

  const out: Result<ProductSummary[]> = { ok: true, data: items };
  if (result.isMock) out.isMock = true;
  return out;
}

/**
 * Slugs for generateStaticParams and the sitemap. Returns an empty list rather
 * than throwing — a sitemap that is briefly short is better than a build that
 * fails because the API was restarting.
 */
export async function fetchAllProductSlugs(): Promise<
  { slug: string; updatedAt?: string }[]
> {
  if (USE_MOCKS) {
    return mockProducts.map((p) => ({ slug: p.slug }));
  }

  try {
    const all: { slug: string }[] = [];
    let page = 1;
    // Bounded so a misbehaving API cannot spin the build forever.
    for (let i = 0; i < 20; i++) {
      const result = await getProducts({ page, limit: 60 });
      all.push(...result.items.map((p) => ({ slug: p.slug })));
      if (page >= result.totalPages || result.items.length === 0) break;
      page += 1;
    }
    return all;
  } catch {
    return [];
  }
}

export { toSummary };
