import type { Metadata } from 'next';
import Link from 'next/link';

import { ProductCard } from '@/components/ProductCard';
import { ShopFilters } from '@/components/ShopFilters';
import { Breadcrumbs, EmptyState, ErrorState, SectionHeading } from '@/components/ui';
import { fetchCategories, fetchProducts } from '@/lib/data';
import { isSortValue } from '@/lib/shop';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Shop All Attars',
  description:
    'Browse every attar in the house — oud, rose, musk, jasmine, sandalwood and amber, each offered in 3ml, 6ml and 12ml. Alcohol-free perfume oils from Kolkata.',
  alternates: { canonical: '/shop' },
};

/**
 * The catalogue.
 *
 * A server component so every product is in the HTML for search engines. The
 * filter controls are a small client island that only rewrites the query
 * string — the grid itself never hydrates.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const category = single(params.category);
  const search = single(params.search);
  const sortParam = single(params.sort);
  const sort = isSortValue(sortParam) ? sortParam : undefined;
  const page = Math.max(1, Number(single(params.page)) || 1);

  const [products, categories] = await Promise.all([
    fetchProducts({
      ...(category ? { category } : {}),
      ...(search ? { search } : {}),
      ...(sort ? { sort } : {}),
      page,
      limit: 12,
    }),
    fetchCategories(),
  ]);

  const activeCategory = categories.ok
    ? categories.data.find((c) => c.slug === category)
    : undefined;

  return (
    <div className="aw-container py-10 sm:py-14">
      <Breadcrumbs
        items={[{ href: '/', label: 'Home' }, { label: activeCategory?.name ?? 'Shop' }]}
      />

      <div className="mt-7">
        <SectionHeading
          as="h1"
          eyebrow={activeCategory ? 'Collection' : 'The Complete Collection'}
          title={activeCategory?.name ?? 'All Attars'}
          description={
            activeCategory?.description ??
            'Every fragrance is available in 3ml, 6ml and 12ml, each size priced and stocked separately.'
          }
        />
      </div>

      <div className="mt-10 sm:mt-12">
        <ShopFilters
          categories={categories.ok ? categories.data : []}
          activeCategory={category}
          activeSort={sort}
          activeSearch={search}
          total={products.ok ? products.data.total : 0}
        />
      </div>

      <div className="mt-10 sm:mt-12">
        {!products.ok ? (
          <ErrorState message={products.error} retryHref="/shop" />
        ) : products.data.items.length === 0 ? (
          <EmptyState
            title={search ? `Nothing matches “${search}”` : 'Nothing here yet'}
            message={
              search || category
                ? 'Try a different search, or browse the whole collection.'
                : 'New lots are decanted every few weeks. Please check back shortly.'
            }
            action={
              search || category ? (
                <Link href="/shop" className="aw-btn aw-btn-outline aw-btn-sm">
                  Clear filters
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-7 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
              {products.data.items.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 3} />
              ))}
            </div>

            <Pagination
              page={products.data.page}
              totalPages={products.data.totalPages}
              params={{
                ...(category ? { category } : {}),
                ...(search ? { search } : {}),
                ...(sort ? { sort } : {}),
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

function Pagination({
  page,
  totalPages,
  params,
}: {
  page: number;
  totalPages: number;
  params: Record<string, string>;
}) {
  if (totalPages <= 1) return null;

  const href = (p: number) => {
    const sp = new URLSearchParams(params);
    if (p > 1) sp.set('page', String(p));
    const qs = sp.toString();
    return `/shop${qs ? `?${qs}` : ''}`;
  };

  // Show a window around the current page so a large catalogue does not
  // produce a hundred links.
  const pages: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(totalPages, from + 4);
  for (let i = from; i <= to; i++) pages.push(i);

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className="aw-btn aw-btn-outline aw-btn-sm" rel="prev">
          Previous
        </Link>
      ) : null}

      <ul className="flex items-center gap-1">
        {pages.map((p) => (
          <li key={p}>
            <Link
              href={href(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`flex h-9 min-w-9 items-center justify-center px-2.5 text-[0.8125rem] transition-colors ${
                p === page
                  ? 'border border-brand bg-brand text-[#f7f4ea]'
                  : 'border border-line-strong text-ink hover:border-brand hover:text-brand'
              }`}
            >
              {p}
            </Link>
          </li>
        ))}
      </ul>

      {page < totalPages ? (
        <Link href={href(page + 1)} className="aw-btn aw-btn-outline aw-btn-sm" rel="next">
          Next
        </Link>
      ) : null}
    </nav>
  );
}
