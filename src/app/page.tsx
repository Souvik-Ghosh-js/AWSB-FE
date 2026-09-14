import Link from 'next/link';
import Image from 'next/image';

import { ProductCard } from '@/components/ProductCard';
import { EmptyState, ErrorState, Ornament, SectionHeading } from '@/components/ui';
import { fetchCategories, fetchFeatured } from '@/lib/data';
import { SHOP } from '@/lib/shop';

/**
 * Home page.
 *
 * A server component: the featured attars must be in the HTML for indexing,
 * not fetched after hydration.
 */
export const revalidate = 300;

export default async function HomePage() {
  // Both sections are independent, so fetch them concurrently rather than
  // waterfalling one behind the other.
  const [featured, categories] = await Promise.all([fetchFeatured(4), fetchCategories()]);

  return (
    <>
      <Hero />

      {/* ------------------------------------------------ featured attars */}
      <section className="aw-container mt-20 sm:mt-28">
        <SectionHeading
          eyebrow="The Collection"
          title="Attars we are known for"
          description="Each is distilled or blended in small lots and decanted by hand. Every fragrance is offered in 3ml, 6ml and 12ml."
          align="center"
        />

        <div className="mt-12 sm:mt-16">
          {!featured.ok ? (
            <ErrorState message={featured.error} retryHref="/" />
          ) : featured.data.length === 0 ? (
            <EmptyState
              title="Our shelves are being restocked"
              message="New lots are decanted every few weeks. Please check back shortly, or write to us and we will tell you the moment they are ready."
              action={
                <Link href="/contact" className="aw-btn aw-btn-outline">
                  Contact the house
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-7 lg:grid-cols-4 lg:gap-x-8">
              {featured.data.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 2} />
              ))}
            </div>
          )}
        </div>

        {featured.ok && featured.data.length > 0 ? (
          <div className="mt-12 text-center sm:mt-16">
            <Link href="/shop" className="aw-btn aw-btn-outline">
              View the full collection
            </Link>
          </div>
        ) : null}
      </section>

      <Ornament className="mt-20 sm:mt-28" />

      {/* --------------------------------------------------- brand story */}
      <BrandStory />

      {/* ---------------------------------------------------- categories */}
      {categories.ok && categories.data.length > 0 ? (
        <section className="aw-container mt-20 sm:mt-28">
          <SectionHeading
            eyebrow="By Character"
            title="Find your family"
            align="center"
          />
          <ul className="mt-10 flex flex-wrap justify-center gap-3 sm:mt-12">
            {categories.data.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category.slug)}`}
                  className="inline-flex items-center gap-2 border border-line-strong bg-surface px-5 py-2.5 text-[0.8125rem] tracking-[0.04em] text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  {category.name}
                  {category.productCount != null && category.productCount > 0 ? (
                    <span className="text-[0.6875rem] text-muted">
                      {category.productCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Assurances />
    </>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      {/* Soft ivory wash with a faint gold bloom, rather than a photograph we
          do not have. Real photography drops straight in here. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 55% at 78% 18%, rgba(176,141,63,0.16) 0%, rgba(176,141,63,0) 62%), radial-gradient(70% 60% at 12% 82%, rgba(20,67,42,0.10) 0%, rgba(20,67,42,0) 60%)',
        }}
      />

      <div className="aw-container relative py-20 sm:py-28 lg:py-36">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="aw-fade-up lg:col-span-6">
            <p className="aw-eyebrow aw-eyebrow-accent">Est. in Rajarhat, Kolkata</p>

            <h1 className="mt-6 text-[2.5rem] leading-[1.05] sm:text-[3.5rem] lg:text-[4.25rem]">
              The quiet art of
              <br />
              <em className="font-[300] not-italic">Bengal attar</em>
            </h1>

            <hr className="aw-rule mt-8 max-w-[14rem]" />

            <p className="mt-8 max-w-lg text-base leading-[1.8] text-muted">
              Alcohol-free perfume oils, aged in glass and decanted by hand. Oud, rose,
              musk and amber — worn close to the skin, the way attar has always been
              worn.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/shop" className="aw-btn aw-btn-primary">
                Explore the collection
              </Link>
              <Link href="/about" className="aw-btn aw-btn-outline">
                Our house
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-7">
              {[
                { term: '3 · 6 · 12', detail: 'millilitre bottles' },
                { term: 'Alcohol', detail: 'free, always' },
                { term: 'Hand', detail: 'decanted in Kolkata' },
              ].map((item) => (
                <div key={item.term}>
                  <dt className="font-[family-name:var(--font-display)] text-xl text-accent">
                    {item.term}
                  </dt>
                  <dd className="mt-1 text-[0.6875rem] tracking-[0.06em] text-muted uppercase">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Hero still life */}
          <div className="lg:col-span-6">
            <div className="aw-plate relative mx-auto aspect-[4/5] w-full max-w-[26rem] overflow-hidden rounded-sm border border-line lg:max-w-none">
              <div className="absolute inset-0 flex items-center justify-center">
                <HeroBottle />
              </div>
              <div className="absolute right-5 bottom-5 left-5 border-t border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] pt-4">
                <p className="aw-eyebrow aw-eyebrow-accent">Signature</p>
                <p className="mt-1.5 font-[family-name:var(--font-display)] text-xl text-brand">
                  Waalid Shamama
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Drawn hero bottle — a placeholder for real product photography. */
function HeroBottle() {
  return (
    <svg
      viewBox="0 0 320 420"
      className="h-[78%] w-auto drop-shadow-[0_18px_28px_rgba(31,42,36,0.14)]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-glass" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3f2d1a" stopOpacity="0.96" />
          <stop offset="32%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#3f2d1a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#2b1e10" />
        </linearGradient>
        <linearGradient id="hero-liquid" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8a5a1c" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#5c3408" />
        </linearGradient>
        <linearGradient id="hero-cap" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#9c7a33" />
          <stop offset="44%" stopColor="#f0e2bd" />
          <stop offset="100%" stopColor="#9c7a33" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="396" rx="92" ry="14" fill="#1f2a24" opacity="0.12" />
      <rect x="132" y="24" width="56" height="44" rx="4" fill="url(#hero-cap)" />
      <rect x="143" y="10" width="34" height="18" rx="3" fill="#b08d3f" />
      <rect x="146" y="64" width="28" height="26" fill="#3f2d1a" opacity="0.5" />
      <path
        d="M96 90 h128 a22 22 0 0 1 22 22 v208 a48 48 0 0 1 -48 48 h-76 a48 48 0 0 1 -48 -48 v-208 a22 22 0 0 1 22 -22 z"
        fill="url(#hero-glass)"
      />
      <path
        d="M104 196 h112 v124 a40 40 0 0 1 -40 40 h-32 a40 40 0 0 1 -40 -40 z"
        fill="url(#hero-liquid)"
      />
      <rect x="112" y="228" width="96" height="76" rx="2" fill="#faf7f0" opacity="0.94" />
      <rect x="126" y="250" width="68" height="1.6" fill="#b08d3f" />
      <rect x="126" y="268" width="46" height="1.4" fill="#7a8079" opacity="0.7" />
      <rect x="126" y="280" width="58" height="1.4" fill="#7a8079" opacity="0.5" />
      <path d="M112 112 q16 -10 32 0 v190 q-16 10 -32 0 z" fill="#ffffff" opacity="0.26" />
    </svg>
  );
}

/* ----------------------------------------------------------- brand story */

function BrandStory() {
  return (
    <section className="mt-20 border-y border-line bg-surface-alt sm:mt-28">
      <div className="aw-container py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <SectionHeading eyebrow="Our House" title="Attar, as it was meant to be" />
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-5 text-[0.9375rem] leading-[1.85] text-ink">
              <p>
                An attar is a perfume oil — no alcohol, no filler, no propellant. It is
                worn on the pulse points, where the warmth of the skin opens it slowly
                over the course of a day. That slowness is the whole point.
              </p>
              <p>
                We work from {SHOP.address.line1}, in {SHOP.address.line2}, sourcing
                oils from the distilleries that still make them the old way — Kannauj
                for rose and shamama, Assam and the southern coast for oud and sandal —
                and blending in lots small enough that every bottle is filled by hand.
              </p>
              <p>
                Nothing here is mass produced, and nothing is pretending to be
                something it is not. When a fragrance sells out, it stays sold out until
                the next lot is ready.
              </p>
            </div>

            <div className="mt-9">
              <Link href="/about" className="aw-btn aw-btn-outline aw-btn-sm">
                Read our story
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ assurances */

function Assurances() {
  const items = [
    {
      title: 'Free of alcohol',
      body: 'Pure perfume oil. Gentler on skin, and it lasts far longer than a spray.',
    },
    {
      title: 'Three sizes',
      body: 'Try at 3ml, settle at 6ml, keep a 12ml on the shelf. Each priced on its own.',
    },
    {
      title: 'Dispatched quickly',
      body: `Orders leave us within ${SHOP.shipping.dispatchDays}, carefully wrapped against the heat.`,
    },
    {
      title: 'Secure payment',
      body: 'UPI, cards and netbanking through Razorpay. We never see your card details.',
    },
  ];

  return (
    <section className="aw-container mt-20 sm:mt-28">
      <div className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.title} className="bg-surface p-7 sm:p-8">
            <span aria-hidden="true" className="text-sm text-accent">
              ❦
            </span>
            <h3 className="mt-3 text-lg">{item.title}</h3>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
