import type { Metadata } from 'next';

import { OrderConfirmation } from '@/components/OrderConfirmation';
import { Breadcrumbs } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Order Confirmation',
  description: 'Your order details.',
  // An order page is personal and must never be indexed.
  robots: { index: false, follow: false },
};

/**
 * Order confirmation.
 *
 * Rendered client-side on purpose: the guest lookup is gated on the order
 * number AND the shopper's email, and neither belongs in a server-rendered,
 * cacheable HTML payload. The page reads the order number from the URL and
 * asks the customer to confirm their email before showing any address detail.
 */
export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orderNumber } = await params;
  const query = await searchParams;

  const justPaid = query.paid === '1';
  // Set when the browser's verify call failed but the payment went through —
  // the order.paid webhook is the authority and confirms it server-side.
  const pendingConfirmation = query.pending === '1';

  return (
    <div className="aw-container py-10 sm:py-14">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Order' }]} />
      <div className="mt-7">
        <OrderConfirmation
          orderNumber={decodeURIComponent(orderNumber)}
          justPaid={justPaid}
          pendingConfirmation={pendingConfirmation}
        />
      </div>
    </div>
  );
}
