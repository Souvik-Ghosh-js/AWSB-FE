import type { Metadata } from 'next';
import Link from 'next/link';

import { PolicyPage } from '@/components/PolicyPage';
import { SHOP } from '@/lib/shop';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description: `How to cancel an order, return a damaged or wrong item, and how refunds are processed by ${SHOP.name}.`,
  alternates: { canonical: '/policies/refund' },
};

export default function RefundPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Refund & Cancellation Policy"
      intro="When you can cancel, what we accept back, and how quickly your money is returned."
    >
      <h2>1. Cancelling an order</h2>
      <p>
        <strong>Before despatch:</strong> you may cancel at any time before your parcel
        leaves us — normally a window of {SHOP.shipping.dispatchDays} — for a full refund
        including the shipping charge. Email{' '}
        <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> or call +91 {SHOP.primaryPhone}{' '}
        with your order number as soon as you can.
      </p>
      <p>
        <strong>After despatch:</strong> once the courier has the parcel we cannot recall
        it. Please refuse the delivery or follow the returns process below.
      </p>
      <p>
        We may also cancel an order ourselves — if the item turns out to be unavailable,
        if the price or description was materially wrong, or if we cannot deliver to your
        pincode. In every such case you are refunded in full, and we will tell you why.
      </p>

      <h2>2. Returns</h2>
      <p>
        Attar is a perfume oil applied directly to skin. For hygiene and safety reasons,{' '}
        <strong>
          we cannot accept the return of a bottle that has been opened, used or had its
          seal broken
        </strong>
        , unless the problem is one of those listed below. This is standard for cosmetics
        and is not a restriction on your rights where goods are faulty.
      </p>

      <h3>We will replace or refund, in full, if:</h3>
      <ul>
        <li>the bottle arrived broken, leaking or damaged in transit;</li>
        <li>you received the wrong fragrance or the wrong size;</li>
        <li>an item listed on your order was missing from the parcel;</li>
        <li>the product is defective — for example a faulty cap or applicator.</li>
      </ul>

      <h3>How to claim</h3>
      <p>
        Write to <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> within{' '}
        <strong>{SHOP.returnWindowDays} days</strong> of delivery, quoting your order
        number, and attach photographs of:
      </p>
      <ul>
        <li>the item as it arrived;</li>
        <li>the outer packaging, including the courier label;</li>
        <li>the damage or the incorrect item.</li>
      </ul>
      <p>
        Photographs let us resolve most claims immediately without your having to post
        anything back. Please keep the packaging until your claim is settled.
      </p>
      <p>
        Where we do need the item returned, we will arrange and pay for the return
        ourselves — you are never asked to pay return shipping on a faulty or incorrect
        item.
      </p>

      <h3>What we cannot accept as a return</h3>
      <ul>
        <li>
          A fragrance you simply did not care for. Scent is personal, which is exactly why
          every attar is offered in a 3ml bottle — try a small size first.
        </li>
        <li>
          Natural variation in colour, thickness or strength between lots. This is a
          property of genuine attar.
        </li>
        <li>Any bottle opened or used, except in the cases listed above.</li>
        <li>
          Claims raised more than {SHOP.returnWindowDays} days after delivery.
        </li>
      </ul>

      <h2>3. Failed and refused deliveries</h2>
      <p>
        Couriers normally attempt delivery twice and call before each attempt — which is
        why we ask for an alternate number at checkout. If a parcel comes back to us
        because the address was incomplete, nobody was available, or delivery was refused,
        we refund the value of the goods but not the original shipping charge, which we
        have already paid.
      </p>

      <h2>4. How refunds are made</h2>
      <p>
        Every refund goes back to the <strong>original payment method</strong> through
        Razorpay. We cannot refund to a different card, account or UPI ID, and we do not
        refund in cash or as store credit unless you ask for the latter.
      </p>
      <p>Timing, once we have approved your refund:</p>
      <ul>
        <li>
          <strong>We initiate it within 2 working days</strong> of approving the claim.
        </li>
        <li>
          <strong>UPI and wallets:</strong> usually 3–5 working days to appear.
        </li>
        <li>
          <strong>Cards and netbanking:</strong> usually 5–7 working days, depending
          entirely on your bank.
        </li>
      </ul>
      <p>
        The final leg is in your bank&rsquo;s hands, not ours. If the money has not
        arrived after 10 working days, contact us with your order number and we will chase
        the payment reference with Razorpay on your behalf.
      </p>

      <h2>5. Partial refunds</h2>
      <p>
        If only part of your order is affected, we refund only that part. The shipping
        charge is refunded in full where the whole order is cancelled or at fault, and is
        not refunded where the rest of the order was delivered correctly.
      </p>

      <h2>6. Still unhappy?</h2>
      <p>
        Write to <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> or call +91{' '}
        {SHOP.phones[0]} or +91 {SHOP.phones[1]}, {SHOP.hours}. We are a small house and a
        person will read your message. If we have got something wrong, we would rather fix
        it than argue about it.
      </p>
      <p>
        See also our <Link href="/policies/shipping">Shipping Policy</Link> and{' '}
        <Link href="/policies/terms">Terms &amp; Conditions</Link>.
      </p>
    </PolicyPage>
  );
}
