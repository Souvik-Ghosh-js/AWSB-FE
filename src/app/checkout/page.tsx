import type { Metadata } from 'next';

import { CheckoutFlow } from '@/components/CheckoutFlow';
import { Breadcrumbs, SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order securely.',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="aw-container py-10 sm:py-14">
      <Breadcrumbs
        items={[
          { href: '/', label: 'Home' },
          { href: '/cart', label: 'Cart' },
          { label: 'Checkout' },
        ]}
      />

      <div className="mt-7">
        <SectionHeading
          as="h1"
          eyebrow="Secure Checkout"
          title="Where should we send it?"
          description="A complete address means your parcel arrives first time. Every field except area, landmark and the alternate number is required."
        />
      </div>

      <div className="mt-10 sm:mt-12">
        <CheckoutFlow />
      </div>
    </div>
  );
}
