import type { Metadata } from 'next';

import { FeedbackForm } from '@/components/FeedbackForm';
import { Breadcrumbs, SectionHeading } from '@/components/ui';
import { SHOP } from '@/lib/shop';

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Write to Attar World Sonar Bangla — ${SHOP.addressLine}. Email ${SHOP.email} or call +91 ${SHOP.primaryPhone}.`,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="aw-container py-10 sm:py-14">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Contact' }]} />

      <div className="mt-7">
        <SectionHeading
          as="h1"
          eyebrow="We answer our own email"
          title="Contact us"
          description="A question about a fragrance, an order, or a wholesale enquiry — write to us and a person will reply."
        />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <FeedbackForm />
        </div>

        <aside className="lg:col-span-5">
          <div className="aw-card p-7 sm:p-8">
            <h2 className="text-xl">Direct</h2>
            <hr className="aw-rule mt-4" />

            <div className="mt-6 space-y-6">
              <div>
                <p className="aw-eyebrow mb-2">Email</p>
                <a
                  href={`mailto:${SHOP.email}`}
                  className="text-[0.875rem] break-all text-ink transition-colors hover:text-brand"
                >
                  {SHOP.email}
                </a>
                <p className="mt-1 text-xs text-muted">
                  We usually reply within one working day.
                </p>
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
                <p className="mt-1 text-xs text-muted">{SHOP.hours}</p>
              </div>

              <div>
                <p className="aw-eyebrow mb-2">Address</p>
                <address className="text-[0.875rem] leading-relaxed text-ink not-italic">
                  {SHOP.name}
                  <br />
                  {SHOP.address.line1}, {SHOP.address.line2}
                  <br />
                  {SHOP.address.city}, {SHOP.address.state} {SHOP.address.pincode}
                  <br />
                  {SHOP.address.country}
                </address>
              </div>

              <div className="border-t border-line pt-5">
                <p className="aw-eyebrow mb-2">About an order</p>
                <p className="text-[0.8125rem] leading-relaxed text-muted">
                  Quoting your order number (it looks like AWSB-2026-00417) gets you a
                  faster answer. You can also check its status yourself on the{' '}
                  <a href="/track" className="underline underline-offset-4">
                    tracking page
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
