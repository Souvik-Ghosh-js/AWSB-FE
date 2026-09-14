import type { Metadata } from 'next';

import { CartView } from '@/components/CartView';
import { Breadcrumbs, SectionHeading } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Your Cart',
  description: 'Review the attars in your cart before checkout.',
  // A cart is per-shopper and has nothing to index.
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <div className="aw-container py-10 sm:py-14">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Cart' }]} />

      <div className="mt-7">
        <SectionHeading as="h1" eyebrow="Your Selection" title="Cart" />
      </div>

      <div className="mt-10 sm:mt-12">
        <CartView />
      </div>
    </div>
  );
}
