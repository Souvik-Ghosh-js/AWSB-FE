import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs, Ornament, SectionHeading } from '@/components/ui';
import { SITE_URL } from '@/lib/api';
import { SHOP } from '@/lib/shop';

export const metadata: Metadata = {
  title: 'Our House',
  description:
    'Attar World Sonar Bangla is an attar house in Dashadrone, Rajarhat, Kolkata — blending and decanting alcohol-free perfume oils by hand in the Bengal tradition.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: SHOP.name,
    description: SHOP.description,
    url: `${SITE_URL}/about`,
    email: SHOP.email,
    telephone: SHOP.phones.map((p) => `+91${p}`),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${SHOP.address.line1}, ${SHOP.address.line2}`,
      addressLocality: SHOP.address.city,
      addressRegion: SHOP.address.state,
      postalCode: SHOP.address.pincode,
      addressCountry: 'IN',
    },
  };

  return (
    <div className="aw-container py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Our House' }]} />

      <div className="mt-7">
        <SectionHeading
          as="h1"
          eyebrow="Since our first lot"
          title="Attar World Sonar Bangla"
          description="An attar house in Rajarhat, working the way attar houses have always worked — small lots, real oils, and time."
        />
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <div className="space-y-6 text-[0.9375rem] leading-[1.85] text-ink">
            <p>
              An attar is perfume in its oldest form: a concentrated oil, worn on the
              pulse points, with no alcohol to carry it and nothing to make it shout.
              It opens slowly against the warmth of the skin, and it stays — often
              through a full day and into the evening.
            </p>
            <p>
              We work from <strong className="font-medium">{SHOP.address.line1}</strong>{' '}
              in {SHOP.address.line2}, on the eastern edge of Kolkata. Every bottle sold
              here is filled by hand from lots we blend ourselves, and every fragrance is
              offered in three sizes — 3ml to try, 6ml to live with, 12ml to keep.
            </p>

            <h2 className="pt-4 text-[1.5rem]">Where the oils come from</h2>
            <p>
              Rose and shamama come from Kannauj, where the old deg-and-bhapka
              distillation is still practised and rose is still distilled onto
              sandalwood rather than into alcohol. Oud comes from Assam and the
              north-east; sandalwood from the south, when it can be had at all.
            </p>
            <p>
              None of this is quick, and none of it is consistent from year to year.
              When a lot is finished, that fragrance goes out of stock and stays out of
              stock until the next one is ready. We would rather show you an empty shelf
              than sell you something diluted.
            </p>

            <h2 className="pt-4 text-[1.5rem]">How we bottle</h2>
            <p>
              Oils are aged in glass — never plastic, which leaches — for as long as the
              blend needs, sometimes the better part of a year. They are then decanted
              into the small faceted bottles attar has always been sold in, sealed, and
              wrapped for the post with the Indian summer in mind.
            </p>
            <p>
              Nothing here contains alcohol. That makes these oils gentler on the skin,
              far longer lasting than a spray, and suitable for anyone who avoids
              alcohol-based perfume for religious or personal reasons.
            </p>

            <h2 className="pt-4 text-[1.5rem]">Buying from us</h2>
            <p>
              Orders are dispatched within {SHOP.shipping.dispatchDays} and reach Kolkata
              addresses in {SHOP.shipping.deliveryKolkata}, and the rest of India in{' '}
              {SHOP.shipping.deliveryIndia}. Payment is handled entirely by Razorpay —
              UPI, card, netbanking or wallet — and we never see your card details.
            </p>
            <p>
              If something arrives wrong, write to us. We are a small house and we answer
              our own email.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/shop" className="aw-btn aw-btn-primary">
              Browse the collection
            </Link>
            <Link href="/contact" className="aw-btn aw-btn-outline">
              Write to us
            </Link>
          </div>
        </div>

        {/* Visit card */}
        <aside className="lg:col-span-5">
          <div className="aw-card sticky top-24 p-7 sm:p-8">
            <h2 className="text-xl">Visit or write</h2>
            <hr className="aw-rule mt-4" />

            <div className="mt-6 space-y-6">
              <div>
                <p className="aw-eyebrow mb-2">Address</p>
                <address className="text-[0.875rem] leading-relaxed text-ink not-italic">
                  {SHOP.address.line1}
                  <br />
                  {SHOP.address.line2}
                  <br />
                  {SHOP.address.city}, {SHOP.address.state} {SHOP.address.pincode}
                  <br />
                  {SHOP.address.country}
                </address>
              </div>

              <div>
                <p className="aw-eyebrow mb-2">Telephone</p>
                {SHOP.phones.map((phone) => (
                  <a
                    key={phone}
                    href={`tel:+91${phone}`}
                    className="block text-[0.875rem] text-ink transition-colors hover:text-brand"
                  >
                    +91 {phone}
                  </a>
                ))}
              </div>

              <div>
                <p className="aw-eyebrow mb-2">Email</p>
                <a
                  href={`mailto:${SHOP.email}`}
                  className="text-[0.875rem] break-all text-ink transition-colors hover:text-brand"
                >
                  {SHOP.email}
                </a>
              </div>

              <div>
                <p className="aw-eyebrow mb-2">Hours</p>
                <p className="text-[0.875rem] text-muted">{SHOP.hours}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <Ornament className="mt-20" />
    </div>
  );
}
