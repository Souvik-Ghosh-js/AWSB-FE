import Link from 'next/link';

import { ProductCard } from '@/components/ProductCard';
import { Photo } from '@/components/Photo';
import { EmptyState, ErrorState, SectionHeading } from '@/components/ui';
import { fetchCategories, fetchFeatured } from '@/lib/data';
import { SHOP } from '@/lib/shop';

/**
 * Home page.
 *
 * A server component: the featured attars must be in the HTML for indexing,
 * not fetched after hydration.
 *
 * Structure borrows from the reference the owner chose — full-bleed
 * photographic hero, a trust bar, a numbered "how it works", testimonials —
 * but in this house's own palette. A fragrance shop dressed as a services site
 * would look like a booking form.
 */
export const revalidate = 300;

export default async function HomePage() {
  const [featured, categories] = await Promise.all([fetchFeatured(4), fetchCategories()]);

  return (
    <>
      <Hero />
      <TrustBar />

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
          <div className="mt-14 text-center">
            <Link href="/shop" className="aw-btn aw-btn-outline">
              See the whole collection
            </Link>
          </div>
        ) : null}
      </section>

      {/* Array.isArray, not just `.ok`: a prerender crash takes down the whole
          build, so the homepage must survive an unexpected response shape
          rather than trust the declared type. */}
      <ScentFamilies
        categories={categories.ok && Array.isArray(categories.data) ? categories.data : []}
      />
      <HowItWorks />
      <Testimonials />
      <ClosingBand />
    </>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-deep">
      {/* One real photograph, full bleed. The reference site's single strongest
          move: a picture doing the talking rather than a gradient. */}
      <div className="absolute inset-0">
        <Photo
          src="/img/oud.jpg"
          alt="Attar oils resting in glass vials"
          ratio="h-full w-full"
          className="h-full w-full"
          priority
          sizes="100vw"
        />
        {/* Two layers: a wash for mood, a left-weighted scrim so the text has
            real contrast rather than relying on the photo being dark enough. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(13,46,29,0.55) 0%, rgba(13,46,29,0.78) 100%)' }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(13,46,29,0.88) 0%, rgba(13,46,29,0.45) 55%, rgba(13,46,29,0.15) 100%)' }}
        />
      </div>

      <div className="aw-container relative py-24 sm:py-32 lg:py-44">
        <div className="max-w-2xl">
          <p className="aw-eyebrow text-accent-soft">Est. in Rajarhat, Kolkata</p>

          <h1 className="mt-6 text-4xl text-white sm:text-5xl lg:text-[4.25rem] lg:leading-[1.05]">
            The quiet art of
            <br />
            <span className="text-accent-bright">Bengal attar</span>
          </h1>

          <p className="mt-7 max-w-xl text-lg leading-[1.75] text-white/80">
            Alcohol-free perfume oils, aged in glass and decanted by hand. Oud, rose,
            musk and amber — worn close to the skin, the way attar has always been worn.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/shop" className="aw-btn aw-btn-primary">
              Explore the collection
            </Link>
            <Link
              href="/about"
              className="aw-btn border border-white/25 text-white hover:bg-white/10"
            >
              Our house
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- trust bar */

/**
 * The reference site puts its credibility markers immediately under the hero.
 * These are all verifiable facts about this shop — nothing invented, and no
 * review counts or customer numbers, because the shop has not opened yet.
 */
function TrustBar() {
  const facts = [
    { stat: '3 · 6 · 12', label: 'millilitre bottles' },
    { stat: '100%', label: 'alcohol-free oils' },
    { stat: 'Hand', label: 'decanted in Kolkata' },
    { stat: '₹49', label: 'delivery within Kolkata' },
  ];

  return (
    <section className="border-b border-line bg-surface">
      <div className="aw-container">
        <dl className="grid grid-cols-2 divide-line sm:grid-cols-4 sm:divide-x">
          {facts.map((f) => (
            <div key={f.label} className="px-2 py-7 text-center sm:px-6 sm:py-8">
              <dt className="aw-display text-xl text-brand sm:text-2xl">{f.stat}</dt>
              <dd className="mt-1.5 text-xs text-soft sm:text-sm">{f.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- scent families */

function ScentFamilies({ categories }: { categories: { id: number; slug: string; name: string }[] }) {
  // Only the two families with a verified photograph get one; the rest render
  // as composed panels rather than borrowed pictures.
  const art: Record<string, string> = {
    oud: '/img/oud.jpg',
    rose: '/img/rose.jpg',
    floral: '/img/rose.jpg',
    musk: '/img/musk.jpg',
  };

  const shown = categories.slice(0, 4);
  if (shown.length === 0) return null;

  return (
    <section className="aw-container mt-24 sm:mt-32">
      <SectionHeading
        eyebrow="By character"
        title="Find your family"
        description="Attar is read by its family before its name. Start where your nose already leans."
        align="center"
      />

      <div className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {shown.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${encodeURIComponent(c.slug)}`}
            className="group relative overflow-hidden rounded-lg"
          >
            <Photo
              src={art[c.slug] ?? null}
              alt={`${c.name} attars`}
              label={c.name}
              ratio="aspect-[3/4]"
              zoom
              sizes="(min-width: 1024px) 25vw, 50vw"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(13,46,29,0.82) 100%)' }}
            />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <p className="aw-display text-lg text-white sm:text-xl">{c.name}</p>
              <p className="mt-0.5 text-xs text-white/70">Explore →</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------------------------------- how it works */

/**
 * Numbered because it genuinely is a sequence — choose, then we decant, then it
 * ships. Numbering a set of unordered features would be decoration.
 */
function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Choose your size',
      body: 'Every attar comes in 3ml, 6ml and 12ml. Start at 3ml if it is new to you — it is a real bottle, not a sample vial.',
    },
    {
      n: '02',
      title: 'We decant by hand',
      body: 'Your bottle is filled and sealed after you order, not pulled from a shelf. Nothing sits open losing its top notes.',
    },
    {
      n: '03',
      title: 'Tracked to your door',
      body: 'Dispatched from Rajarhat with a tracking number by email. ₹49 within Kolkata, ₹99 anywhere else in India.',
    },
  ];

  return (
    <section className="mt-24 border-y border-line bg-surface-alt py-20 sm:mt-32 sm:py-24">
      <div className="aw-container">
        <SectionHeading eyebrow="How it works" title="From our shelf to your wrist" align="center" />

        <ol className="mt-14 grid gap-10 sm:gap-12 lg:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n}>
              <p className="aw-display text-3xl text-accent">{s.n}</p>
              <hr className="aw-rule mt-4 max-w-[3.5rem]" />
              <h3 className="mt-5 text-xl">{s.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-[1.7] text-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- testimonials */

/**
 * Deliberately NOT customer quotes. The shop has not sold anything yet, and
 * inventing reviews would be a lie a customer could act on. These are notes on
 * the craft — true, and replaceable with real reviews once they exist.
 */
function Testimonials() {
  const notes = [
    {
      title: 'Why oil, not spirit',
      body: 'Attar carries no alcohol, so it does not flash off in the first ten minutes. It warms with your skin and stays close through the day.',
    },
    {
      title: 'Why small bottles',
      body: 'Three millilitres of a good attar outlasts a large bottle of eau de toilette. A drop at the wrist and behind the ear is the whole application.',
    },
    {
      title: 'Why it ages',
      body: 'Oud and amber are laid down in glass and left. Time rounds the sharp edges off a fresh distillation — the wait is part of the making.',
    },
  ];

  return (
    <section className="aw-container mt-24 sm:mt-32">
      <SectionHeading eyebrow="On attar" title="What makes it different" align="center" />

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {notes.map((n) => (
          <article
            key={n.title}
            className="rounded-lg border border-line bg-surface p-7 shadow-[var(--shadow-card)]"
          >
            <h3 className="text-lg">{n.title}</h3>
            <p className="mt-3 text-[0.9375rem] leading-[1.75] text-soft">{n.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- closing band */

function ClosingBand() {
  return (
    <section className="relative isolate mt-24 overflow-hidden sm:mt-32">
      <div className="absolute inset-0">
        <Photo
          src="/img/texture.jpg"
          alt=""
          ratio="h-full w-full"
          className="h-full w-full"
          sizes="100vw"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(13,46,29,0.94) 0%, rgba(13,46,29,0.80) 100%)' }}
        />
      </div>

      <div className="aw-container relative py-20 text-center sm:py-24">
        <h2 className="mx-auto max-w-2xl text-3xl text-white sm:text-4xl">
          Not sure where to begin?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-[1.75] text-white/75">
          Tell us what you already wear, or what you want to smell like, and we will
          point you at two or three from the shelf. No obligation.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/contact" className="aw-btn aw-btn-primary">
            Ask the house
          </Link>
          <a
            href={`tel:+91${SHOP.phones[0]}`}
            className="aw-btn border border-white/25 text-white hover:bg-white/10"
          >
            Call {SHOP.phones[0]}
          </a>
        </div>
      </div>
    </section>
  );
}
