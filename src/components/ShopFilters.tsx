'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { SORT_OPTIONS } from '@/lib/shop';
import type { Category } from '@/lib/types';

/**
 * Catalogue filters.
 *
 * A deliberately thin client island: it only rewrites the query string and
 * lets the server re-render the grid. That keeps the products themselves in
 * server-rendered HTML rather than behind a client fetch.
 */
export function ShopFilters({
  categories,
  activeCategory,
  activeSort,
  activeSearch,
  total,
}: {
  categories: Category[];
  activeCategory?: string | undefined;
  activeSort?: string | undefined;
  activeSearch?: string | undefined;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(activeSearch ?? '');

  const push = (updates: Record<string, string | null>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') sp.delete(key);
      else sp.set(key, value);
    }
    // Any filter change invalidates the current page number.
    sp.delete('page');
    const qs = sp.toString();
    router.push(`/shop${qs ? `?${qs}` : ''}`);
  };

  const hasFilters = Boolean(activeCategory || activeSearch || activeSort);

  return (
    <div className="border-y border-line py-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* Categories */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible lg:pb-0">
          <button
            type="button"
            onClick={() => push({ category: null })}
            aria-pressed={!activeCategory}
            className={`shrink-0 border px-4 py-2 text-[0.75rem] tracking-[0.06em] whitespace-nowrap transition-colors ${
              !activeCategory
                ? 'border-brand bg-brand text-[#f7f4ea]'
                : 'border-line-strong text-ink hover:border-brand hover:text-brand'
            }`}
          >
            All
          </button>

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => push({ category: category.slug })}
              aria-pressed={activeCategory === category.slug}
              className={`shrink-0 border px-4 py-2 text-[0.75rem] tracking-[0.06em] whitespace-nowrap transition-colors ${
                activeCategory === category.slug
                  ? 'border-brand bg-brand text-[#f7f4ea]'
                  : 'border-line-strong text-ink hover:border-brand hover:text-brand'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Search + sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              push({ search: searchValue.trim() || null });
            }}
            className="relative"
            role="search"
          >
            <label htmlFor="shop-search" className="sr-only">
              Search attars
            </label>
            <input
              id="shop-search"
              type="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Search by name or note"
              className="aw-field w-full pr-10 sm:w-56"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-muted transition-colors hover:text-brand"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="5.4" stroke="currentColor" strokeWidth="1.4" />
                <path
                  d="M13.2 13.2 L17 17"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </form>

          <div className="flex items-center gap-2">
            <label htmlFor="shop-sort" className="aw-eyebrow shrink-0">
              Sort
            </label>
            <select
              id="shop-sort"
              value={activeSort ?? 'newest'}
              onChange={(e) => push({ sort: e.target.value })}
              className="aw-field w-full sm:w-44"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-xs text-muted">
          {total} {total === 1 ? 'fragrance' : 'fragrances'}
          {activeSearch ? ` matching “${activeSearch}”` : ''}
        </p>
        {hasFilters ? (
          <Link href="/shop" className="text-xs text-brand-soft underline underline-offset-4">
            Clear all
          </Link>
        ) : null}
      </div>
    </div>
  );
}
