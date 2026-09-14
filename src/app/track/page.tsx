import type { Metadata } from 'next';

import { TrackOrderForm } from '@/components/TrackOrderForm';
import { Breadcrumbs, SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Track Your Order',
  description:
    'Look up any Attar World Sonar Bangla order with your order number and the email address you used at checkout.',
  alternates: { canonical: '/track' },
};

export default function TrackPage() {
  return (
    <div className="aw-container py-10 sm:py-14">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Track Order' }]} />

      <div className="mt-7">
        <SectionHeading
          as="h1"
          eyebrow="Order Status"
          title="Track your order"
          description="Enter your order number and the email address you used at checkout. No account needed."
        />
      </div>

      <div className="mt-10 sm:mt-12">
        <TrackOrderForm />
      </div>
    </div>
  );
}
