import type { Metadata } from 'next';
import Link from 'next/link';

import { PolicyPage } from '@/components/PolicyPage';
import { formatPaise } from '@/lib/format';
import { SHOP } from '@/lib/shop';

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: `Shipping rates, despatch and delivery times for ${SHOP.name}. Flat ₹49 within Kolkata and ₹99 elsewhere in India.`,
  alternates: { canonical: '/policies/shipping' },
};

export default function ShippingPolicyPage() {
  const kolkata = formatPaise(SHOP.shipping.kolkataPaise, { compact: true });
  const rest = formatPaise(SHOP.shipping.restOfIndiaPaise, { compact: true });

  return (
    <PolicyPage
      eyebrow="Legal"
      title="Shipping Policy"
      intro="What shipping costs, when your parcel leaves us, and how long it takes to arrive."
    >
      <h2>1. Where we deliver</h2>
      <p>
        We deliver anywhere in India that our courier partners serve. We do not currently
        ship outside India.
      </p>

      <h2>2. What shipping costs</h2>
      <p>
        Shipping is a flat rate, decided by your delivery pincode and shown in your order
        summary before you pay:
      </p>
      <ul>
        <li>
          <strong>{kolkata} — Kolkata.</strong> Pincodes {SHOP.shipping.kolkataRangeStart}{' '}
          to {SHOP.shipping.kolkataRangeEnd}, which covers Kolkata proper along with Salt
          Lake, New Town and Rajarhat.
        </li>
        <li>
          <strong>{rest} — rest of India.</strong> Every other pincode, including Howrah
          (711xxx) and the rest of West Bengal.
        </li>
      </ul>
      <p>
        There is no minimum order value, and the rate is the same however many bottles you
        buy. The exact charge is calculated live from your pincode at checkout, so you
        always see it before paying.
      </p>
      <p>
        <strong>We do not offer cash on delivery.</strong> All orders are paid for online
        through Razorpay.
      </p>

      <h2>3. When your order leaves us</h2>
      <p>
        Orders are packed and handed to the courier within{' '}
        <strong>{SHOP.shipping.dispatchDays}</strong> of payment, excluding Sundays and
        public holidays. Orders placed late in the evening are processed the following
        working day.
      </p>
      <p>
        Occasionally a fragrance needs decanting before it can go out, which can add a day.
        If anything will take longer than that, we will email you rather than leave you
        wondering.
      </p>

      <h2>4. How long delivery takes</h2>
      <ul>
        <li>
          <strong>Kolkata and surrounds:</strong> {SHOP.shipping.deliveryKolkata} from
          despatch.
        </li>
        <li>
          <strong>Rest of India:</strong> {SHOP.shipping.deliveryIndia} from despatch.
        </li>
      </ul>
      <p>
        Remote pincodes, the north-east, and hill and island regions can take longer.
        These are courier estimates, not guarantees — festivals, weather and local
        disruption all affect them.
      </p>

      <h2>5. Tracking your parcel</h2>
      <p>
        As soon as your parcel is collected we email you the courier&rsquo;s name and the
        tracking (AWB) number. You can also look your order up at any time on our{' '}
        <Link href="/track">tracking page</Link> using your order number and the email
        address you used at checkout.
      </p>
      <p>
        We ship with Blue Dart, Delhivery, XpressBees, Ekart, Amazon Shipping, India Post,
        DTDC, Professional Couriers and Trackon, choosing whichever serves your pincode
        best. A few of these — India Post and Professional Couriers among them — require
        the tracking number to be typed into their own website rather than opening from a
        link. Where that is the case, we show the number prominently so you can copy it
        across.
      </p>
      <p>
        Tracking information can take up to 24 hours to appear on a courier&rsquo;s system
        after collection. A number that shows nothing on the first evening is normal.
      </p>

      <h2>6. Delivery attempts</h2>
      <p>
        Couriers normally attempt delivery twice and call beforehand — which is why we ask
        for a mobile number, and offer an alternate one, at checkout. Please make sure at
        least one number is reachable.
      </p>
      <p>
        If both attempts fail, the parcel is returned to us. We will contact you to
        arrange re-despatch, which is charged at the normal shipping rate. No refund is
        made for a returned parcel — see our{' '}
        <Link href="/policies/refund">Refund, Cancellation &amp; Replacement Policy</Link>.
      </p>

      <h2>7. How we pack</h2>
      <p>
        Attar bottles are glass and India is hot. Every bottle is sealed, wrapped and
        boxed with cushioning for the journey.{' '}
        <strong>
          Please record a continuous video of every parcel from before you open it
        </strong>
        : if an item arrives damaged or leaking, that unboxing video is required for a
        replacement. Submit a complaint on our <Link href="/contact">Contact page</Link>{' '}
        within {SHOP.returnWindowDays} days, then email the video quoting your complaint
        ID. We replace damaged items; we do not refund. Full details are in our{' '}
        <Link href="/policies/refund">Refund, Cancellation &amp; Replacement Policy</Link>.
      </p>

      <h2>8. Wrong or incomplete addresses</h2>
      <p>
        Our checkout requires a complete address — house or flat number and building,
        city, state and a valid 6-digit pincode — because an incomplete address is the
        commonest reason a parcel never arrives. Please check it before you pay.
      </p>
      <p>
        If you spot a mistake, email{' '}
        <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> or call +91{' '}
        {SHOP.primaryPhone} immediately. We can usually correct an address before
        despatch; afterwards it is with the courier and out of our hands.
      </p>

      <h2>9. Questions</h2>
      <p>
        Call +91 {SHOP.phones[0]} or +91 {SHOP.phones[1]} ({SHOP.hours}), or write to{' '}
        <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> quoting your order number.
      </p>
    </PolicyPage>
  );
}
