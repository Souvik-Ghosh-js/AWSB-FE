import Image from 'next/image';
import Link from 'next/link';

import { Reveal } from '@/components/motion';
import { ProductCard } from '@/components/ProductCard';
import { Photo } from '@/components/Photo';
import { EmptyState, ErrorState } from '@/components/ui';
import { fetchProducts } from '@/lib/data';
import { formatPaise } from '@/lib/format';
import { SHOP } from '@/lib/shop';
import type { ProductSummary } from '@/lib/types';

/**
 * Home page — which is the shop.
 *
 * The previous home page was a tall photograph, a story, a "how it works" and
 * three essays before a customer could buy anything, and the four products it
 * did show were "From ₹0". People arrive here to buy attar. So:
 *
 *   1. One bold band: what this is, a search box, the scent families.
 *   2. The products — a buyable grid with size and price on every card.
 *   3. Families, as a second way in.
 *   4. One short row on why attar. That is all.
 *
 * A server component: every product is in the HTML for search engines.
 */
export const revalidate = 300;

const HOME_GRID = 12;

export default async function HomePage() {
  // Two pages of 60 cover the whole catalogue in one round trip each, and
  // give the family chips real counts rather than a hand-typed list.
  const [page1, page2] = await Promise.all([
    fetchProducts({ limit: 60, page: 1 }),
    fetchProducts({ limit: 60, page: 2 }),
  ]);

  const all: ProductSummary[] = [
    ...(page1.ok ? page1.data.items : []),
    ...(page2.ok ? page2.data.items : []),
  ];
  const total = page1.ok ? page1.data.total : all.length;
  const families = familyCounts(all);
  const cheapest = all.reduce<number | null>((min, p) => {
    const price = p.fromPricePaise ?? p.minPricePaise;
    if (price == null || price <= 0) return min;
    return min == null || price < min ? price : min;
  }, null);

  // Featured first if any are flagged, then the rest in catalogue order.
  const featured = all.filter((p) => p.isFeatured);
  const grid = [...featured, ...all.filter((p) => !p.isFeatured)].slice(0, HOME_GRID);

  return (
    <>
      <Band cheapest={cheapest} families={families} />
      <TrustLine />

      {/* ------------------------------------------------------ products */}
      <section id="shop" className="aw-container mt-10 scroll-mt-24 sm:mt-14">
        <Reveal className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="aw-eyebrow aw-eyebrow-accent">The shelf</p>
            <h2 className="mt-1.5 text-3xl sm:text-4xl">
              Attars
              <span className="text-brand-soft">, three sizes each</span>
            </h2>
          </div>
          <Link href="/shop" className="aw-btn aw-btn-outline">
            See all →
          </Link>
        </Reveal>

        <div className="mt-7 sm:mt-9">
          {!page1.ok ? (
            <ErrorState message={page1.error} retryHref="/" />
          ) : grid.length === 0 ? (
            <EmptyState
              title="Our shelves are being restocked"
              message="New lots are decanted every few weeks. Please check back shortly."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {grid.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} index={i} />
              ))}
            </div>
          )}
        </div>

        {grid.length > 0 && total > grid.length ? (
          <Reveal className="mt-10 text-center">
            <Link href="/shop" className="aw-btn aw-btn-primary aw-btn-lg">
              Shop all attars
            </Link>
          </Reveal>
        ) : null}
      </section>

      <Families families={families} />
      <WhyAttar />
    </>
  );
}

/* ------------------------------------------------------------------ band */

function Band({
  cheapest,
  families,
}: {
  cheapest: number | null;
  families: { name: string; count: number }[];
}) {
  return (
    <section className="relative isolate min-h-[110vw] overflow-hidden bg-brand-deep sm:min-h-0">
      {/* The bottles sit right-of-centre in the source photo (its left side
          was inpainted clean specifically so the live headline can sit over
          it), so the crop is biased right to keep them in frame at every
          width. The min-height floor keeps the section from the photo's
          ~1.5:1 aspect being forced much taller/narrower than that by the
          wrapped mobile headline, which would otherwise crop the bottles
          out entirely. */}
      <div className="absolute inset-0">
        <Image
          src="/img/hero-banner.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_center]"
        />
      </div>
      {/* Left-to-right fade for headline contrast over the photo — the photo
          itself no longer carries any text, so this only needs to darken,
          not hide competing copy. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: 'linear-gradient(90deg, rgba(36,10,16,0.9) 0%, rgba(36,10,16,0.65) 50%, rgba(36,10,16,0.25) 100%)' }}
      />

      <div className="aw-container relative py-12 sm:py-16">
        <div className="max-w-3xl">
          {/* The hero is in view at load, so it plays on mount with stepped
              delays: eyebrow, headline, line, search, families. */}
          <Reveal as="p" mount y={12} className="aw-eyebrow text-accent-bright">
            Hand-decanted in Rajarhat, Kolkata
          </Reveal>
          <Reveal
            as="h1"
            mount
            delay={0.08}
            y={24}
            className="mt-4 text-4xl text-white sm:text-5xl lg:text-[3.75rem]"
          >
            Attar, sold by the millilitre.
          </Reveal>
          <Reveal
            as="p"
            mount
            delay={0.18}
            className="mt-4 max-w-xl text-lg leading-relaxed text-white/80"
          >
            Alcohol-free perfume oils in 3, 6 and 12 ml bottles
            {cheapest != null ? `, from ${formatPaise(cheapest, { compact: true })}` : ''}. Delivered
            across India.
          </Reveal>

          <Reveal mount delay={0.28}>
          <form action="/shop" method="get" role="search" className="mt-7 flex max-w-xl gap-2">
            <label htmlFor="home-search" className="sr-only">
              Search attars
            </label>
            <input
              id="home-search"
              name="search"
              type="search"
              placeholder="Search — oud, rose, khus, shamama…"
              className="aw-field min-h-12 flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/55 focus:border-accent-bright"
            />
            <button type="submit" className="aw-btn aw-btn-accent shrink-0">
              Search
            </button>
          </form>
          </Reveal>

          {families.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {families.slice(0, 9).map((f, i) => (
                <Reveal as="li" mount key={f.name} y={10} delay={0.38 + i * 0.04}>
                  <Link
                    href={`/shop?search=${encodeURIComponent(f.name)}`}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/25 px-3.5 text-sm font-medium text-white transition-colors hover:border-accent-bright hover:bg-white/10"
                  >
                    {f.name}
                    <span className="text-xs text-white/55">{f.count}</span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- trust line */

function TrustLine() {
  const facts = [
    { k: '100%', v: 'alcohol-free oils' },
    { k: '3 · 6 · 12', v: 'millilitre bottles' },
    { k: formatPaise(SHOP.shipping.kolkataPaise, { compact: true }), v: 'delivery in Kolkata' },
    { k: '1–2 days', v: 'to dispatch' },
  ];
  return (
    <div className="border-b border-line bg-surface">
      <div className="aw-container">
        <ul className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {facts.map((f, i) => (
            <Reveal
              as="li"
              key={f.v}
              y={10}
              delay={i * 0.08}
              className="flex items-baseline justify-center gap-2 px-2 py-4 text-center"
            >
              <span className="aw-display text-lg text-brand">{f.k}</span>
              <span className="text-xs text-soft">{f.v}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- families */

function familyCounts(products: ProductSummary[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of products) {
    const f = p.scentFamily?.trim();
    if (!f) continue;
    counts.set(f, (counts.get(f) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function Families({ families }: { families: { name: string; count: number }[] }) {
  if (families.length === 0) return null;

  // The only real photographs the shop has. Everything else renders as a
  // composed panel rather than a borrowed picture.
  const art: Record<string, string> = {
    oud: '/img/oud.jpg',
    floral: '/img/rose.jpg',
    musk: '/img/musk.jpg',
  };

  return (
    <section className="aw-container mt-16 sm:mt-24">
      <Reveal className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="aw-eyebrow aw-eyebrow-accent">By family</p>
          <h2 className="mt-1.5 text-3xl sm:text-4xl">Start where your nose leans</h2>
        </div>
      </Reveal>

      <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {families.slice(0, 8).map((f, i) => (
          <Reveal key={f.name} delay={(i % 4) * 0.07}>
          <Link
            href={`/shop?search=${encodeURIComponent(f.name)}`}
            className="group relative block overflow-hidden rounded-lg"
          >
            <Photo
              src={art[f.name.toLowerCase()] ?? null}
              alt={`${f.name} attars`}
              label={f.name}
              ratio="aspect-[4/3]"
              zoom
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(36,10,16,0.90) 100%)' }}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
              <p className="aw-display text-xl text-white">{f.name}</p>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                {f.count}
              </span>
            </div>
          </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- why attar */

/**
 * Deliberately NOT customer quotes — nothing has sold yet, and invented
 * reviews would be a lie a customer could act on. These are true notes on the
 * product, kept short and placed last.
 */
function WhyAttar() {
  const notes = [
    { t: 'No alcohol', b: 'Pure oil warms with your skin and stays close all day instead of flashing off in ten minutes.' },
    { t: 'A drop is enough', b: 'Three millilitres outlasts a big bottle of spray. One dab at the wrist and behind the ear.' },
    { t: 'Decanted to order', b: `Filled and sealed when you order, then dispatched within ${SHOP.shipping.dispatchDays} with tracking.` },
  ];
  return (
    <section className="aw-container mt-16 mb-4 sm:mt-24">
      <div className="grid gap-3 rounded-lg border border-line bg-surface p-5 sm:grid-cols-3 sm:gap-6 sm:p-7">
        {notes.map((n, i) => (
          <Reveal key={n.t} delay={i * 0.1}>
            <h3 className="text-lg">{n.t}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-soft">{n.b}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
