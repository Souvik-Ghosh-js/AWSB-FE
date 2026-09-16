import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ProductGallery } from '@/components/ProductGallery';
import { ProductPurchase } from '@/components/ProductPurchase';
import { Breadcrumbs, ErrorState, Ornament, Stars } from '@/components/ui';
import { SITE_URL } from '@/lib/api';
import { fetchAllProductSlugs, fetchProduct } from '@/lib/data';
import { formatDate, formatPaise, stripMarkdown, truncate } from '@/lib/format';
import { SHOP } from '@/lib/shop';
import type { ProductDetail } from '@/lib/types';

export const revalidate = 300;

/**
 * Pre-render the catalogue at build time so product pages are static and
 * instantly indexable. Anything not listed still renders on demand.
 */
export async function generateStaticParams() {
  const slugs = await fetchAllProductSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await fetchProduct(slug);

  if (!result.ok || !result.data) {
    return { title: 'Fragrance not found' };
  }

  const product = result.data;
  const description =
    product.metaDescription ??
    truncate(product.tagline ?? stripMarkdown(product.description), 158);
  const image = product.images.find((i) => i.isPrimary) ?? product.images[0];
  const canonical = `/product/${product.slug}`;

  return {
    title: product.metaTitle ?? product.name,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title: product.metaTitle ?? `${product.name} — ${SHOP.shortName}`,
      description,
      url: `${SITE_URL}${canonical}`,
      // A data: URI placeholder is not a valid OG image, so only real hosted
      // photography is advertised to crawlers.
      images:
        image && !image.url.startsWith('data:')
          ? [{ url: image.url, alt: image.altText ?? product.name }]
          : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await fetchProduct(slug);

  // An API failure is not the same as a missing product: show an error panel
  // rather than a 404 that would tell a crawler the product is gone.
  if (!result.ok) {
    return (
      <div className="aw-container py-16">
        <ErrorState message={result.error} retryHref={`/product/${slug}`} />
      </div>
    );
  }

  if (!result.data) notFound();

  const product = result.data;
  const enabledVariants = product.variants;
  const approvedReviews = product.reviews ?? [];

  return (
    <div className="aw-container py-8 sm:py-12">
      <ProductJsonLd product={product} />

      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/shop', label: 'Shop' },
          // Link the family crumb by search, not by category. Products are
          // not assigned to categories (the API omits `categories` entirely,
          // and `product.categories[0]` crashed the prerender of every product
          // page on Netlify). Search matches scent_family, so this crumb
          // actually lands on the family's products — the same link the home
          // page chips use.
          ...(product.scentFamily
            ? [
                {
                  href: `/shop?search=${encodeURIComponent(product.scentFamily)}`,
                  label: product.scentFamily,
                },
              ]
            : []),
          { label: product.name },
        ]}
      />

      {/* --------------------------------------------- gallery + purchase */}
      <div className="mt-7 grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        <div className="lg:col-span-5">
          {product.scentFamily ? (
            <p className="aw-eyebrow aw-eyebrow-accent">{product.scentFamily}</p>
          ) : null}

          <h1 className="mt-3 text-[2rem] leading-[1.1] sm:text-[2.5rem]">
            {product.name}
          </h1>

          {product.tagline ? (
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
              {product.tagline}
            </p>
          ) : null}

          {product.ratingCount > 0 ? (
            <div className="mt-4">
              <a href="#reviews" className="inline-block">
                <Stars rating={product.ratingAvg} count={product.ratingCount} size="md" />
              </a>
            </div>
          ) : null}

          <hr className="aw-rule mt-7" />

          {/* The size selector: 3ml / 6ml / 12ml, each with its own price and
              stock, both of which come straight from product_variants. */}
          <div className="mt-7">
            <ProductPurchase product={product} />
          </div>

          {/* Scent notes */}
          {product.scentNotes ? (
            <div className="mt-10 border-t border-line pt-7">
              <h2 className="aw-eyebrow mb-4">The Composition</h2>
              <dl className="space-y-3.5">
                {(
                  [
                    ['Top', product.scentNotes.top],
                    ['Heart', product.scentNotes.heart],
                    ['Base', product.scentNotes.base],
                  ] as const
                ).map(([label, notes]) =>
                  notes && notes.length > 0 ? (
                    <div key={label} className="flex gap-4">
                      <dt className="w-14 shrink-0 text-[0.6875rem] tracking-[0.1em] text-accent uppercase">
                        {label}
                      </dt>
                      <dd className="text-[0.8125rem] leading-relaxed text-ink">
                        {notes.join(' · ')}
                      </dd>
                    </div>
                  ) : null
                )}
              </dl>
            </div>
          ) : null}

          {/* Assurances */}
          <ul className="mt-8 space-y-2.5 border-t border-line pt-7">
            {[
              'Alcohol-free perfume oil, decanted by hand',
              `Dispatched within ${SHOP.shipping.dispatchDays}`,
              `₹${SHOP.shipping.kolkataPaise / 100} shipping in Kolkata · ₹${
                SHOP.shipping.restOfIndiaPaise / 100
              } elsewhere`,
              // Sits with the other honest, practical disclosures here rather
              // than a separate alarmist warning box — this is routine, not
              // exceptional. See Terms & Conditions §2 for the full wording.
              'Bottle, label and packaging may vary slightly from the image shown',
            ].map((line) => (
              <li key={line} className="flex gap-2.5 text-[0.8125rem] text-muted">
                <span aria-hidden="true" className="text-accent">
                  ·
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------------ description */}
      {product.description ? (
        <section className="mt-20 sm:mt-28">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-4">
              <h2 className="text-[1.625rem] sm:text-[2rem]">About this attar</h2>
              <hr className="aw-rule mt-5 max-w-[12rem]" />
            </div>
            <div className="lg:col-span-8">
              <div className="max-w-2xl space-y-5 text-[0.9375rem] leading-[1.85] text-ink">
                {product.description
                  .split(/\n{2,}/)
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{stripMarkdown(para)}</p>
                  ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ---------------------------------------------------- size pricing */}
      {enabledVariants.length > 0 ? (
        <section className="mt-20 sm:mt-24">
          <h2 className="text-[1.625rem] sm:text-[2rem]">Sizes &amp; pricing</h2>
          <hr className="aw-rule mt-5 max-w-[12rem]" />

          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-line-strong">
                  <th scope="col" className="aw-eyebrow py-3 pr-4">
                    Size
                  </th>
                  <th scope="col" className="aw-eyebrow py-3 pr-4">
                    Price
                  </th>
                  <th scope="col" className="aw-eyebrow py-3">
                    Availability
                  </th>
                </tr>
              </thead>
              <tbody>
                {enabledVariants.map((variant) => (
                  <tr key={variant.id} className="border-b border-line">
                    <td className="py-4 pr-4 font-[family-name:var(--font-display)] text-lg">
                      {variant.sizeMl} ml
                    </td>
                    <td className="aw-price py-4 pr-4 text-base">
                      {formatPaise(variant.pricePaise, { compact: true })}
                      {variant.compareAtPaise ? (
                        <span className="ml-2 text-xs text-muted line-through">
                          {formatPaise(variant.compareAtPaise, { compact: true })}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-4 text-[0.8125rem] text-muted">
                      {!variant.inStock
                        ? 'Sold out'
                        : variant.isLowStock
                          ? 'Only a few left'
                          : 'In stock'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Ornament className="mt-20 sm:mt-24" />

      {/* --------------------------------------------------------- reviews */}
      <section id="reviews" className="mt-16 scroll-mt-24 sm:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[1.625rem] sm:text-[2rem]">What customers say</h2>
            <hr className="aw-rule mt-5 max-w-[12rem]" />
          </div>
          {product.ratingCount > 0 ? (
            <Stars rating={product.ratingAvg} count={product.ratingCount} size="md" />
          ) : null}
        </div>

        {approvedReviews.length === 0 ? (
          <p className="mt-8 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
            No reviews yet for {product.name}. Reviews are invited by email once an order
            has been delivered, so everything you read here comes from someone who
            actually bought the bottle.
          </p>
        ) : (
          <ul className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {approvedReviews.map((review) => (
              <li key={review.id} className="border-t border-line pt-6">
                <div className="flex items-center justify-between gap-4">
                  <Stars rating={review.rating} />
                  {review.isVerifiedPurchase ? (
                    <span className="aw-badge bg-[color-mix(in_srgb,var(--color-brand-soft)_12%,transparent)] text-brand-soft">
                      Verified purchase
                    </span>
                  ) : null}
                </div>

                {review.title ? (
                  <h3 className="mt-3 text-lg">{review.title}</h3>
                ) : null}

                {review.body ? (
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-ink">
                    {review.body}
                  </p>
                ) : null}

                <p className="mt-3 text-xs text-muted">
                  {review.authorName} · {formatDate(review.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-16 border-t border-line pt-10 text-center">
        <Link href="/shop" className="aw-btn aw-btn-outline">
          Back to the collection
        </Link>
      </div>
    </div>
  );
}

/**
 * Product JSON-LD.
 *
 * Uses AggregateOffer across the three sizes, because one product genuinely
 * has three prices. No tax fields appear — the shop is not GST registered, and
 * inventing a priceSpecification with tax would be a false claim to Google.
 */
function ProductJsonLd({ product }: { product: ProductDetail }) {
  const url = `${SITE_URL}/product/${product.slug}`;
  const prices = product.variants.map((v) => v.pricePaise / 100);
  const anyInStock = product.variants.some((v) => v.inStock);

  const images = product.images
    .filter((i) => !i.url.startsWith('data:'))
    .map((i) => i.url);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: stripMarkdown(product.description ?? product.tagline ?? ''),
    sku: product.variants[0]?.sku,
    category: product.scentFamily ?? undefined,
    url,
    brand: {
      '@type': 'Brand',
      name: SHOP.name,
    },
    ...(images.length > 0 ? { image: images } : {}),
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      offerCount: product.variants.length,
      availability: anyInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SHOP.name },
      offers: product.variants.map((variant) => ({
        '@type': 'Offer',
        name: `${product.name} — ${variant.sizeMl}ml`,
        sku: variant.sku,
        price: (variant.pricePaise / 100).toFixed(2),
        priceCurrency: 'INR',
        availability: variant.inStock
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url,
      })),
    },
  };

  if (product.ratingCount > 0 && product.ratingAvg != null) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.ratingAvg,
      reviewCount: product.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (product.reviews && product.reviews.length > 0) {
    jsonLd.review = product.reviews.slice(0, 5).map((review) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
      author: { '@type': 'Person', name: review.authorName },
      datePublished: review.createdAt?.slice(0, 10),
      name: review.title ?? undefined,
      reviewBody: review.body ?? undefined,
    }));
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is escaped below; the data comes from our own
      // API, and </script> cannot survive the replace.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}
