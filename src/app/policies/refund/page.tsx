import type { Metadata } from 'next';
import Link from 'next/link';

import { PolicyPage } from '@/components/PolicyPage';
import { SHOP } from '@/lib/shop';

export const metadata: Metadata = {
  title: 'Refund, Cancellation & Replacement Policy',
  description: `${SHOP.name} does not offer refunds. Items that arrive damaged are replaced, subject to an unboxing video and a complaint ID.`,
  alternates: { canonical: '/policies/refund' },
};

export default function RefundPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Refund, Cancellation & Replacement Policy"
      intro="We do not refund. A product that reaches you damaged is replaced, provided the claim is backed by a complete unboxing video and a complaint ID."
    >
      <h2>1. No refunds</h2>
      <p>
        <strong>
          {SHOP.name} does not offer refunds under any circumstances. No product is
          refunded, in full or in part, for any reason.
        </strong>{' '}
        The only remedy we offer is replacement of an item that arrived damaged, on the
        conditions set out below. This applies to every order placed on this website and
        every payment method.
      </p>
      <p>
        Attar is a perfume oil applied directly to the skin. Once a bottle has left us it
        cannot be resold, which is why every fragrance is offered in a 3ml size — try the
        small bottle before committing to a larger one.
      </p>

      <h2>2. Cancellations</h2>
      <p>
        Because we do not refund, <strong>an order cannot be cancelled once payment has
        been made</strong>. Please check your fragrances, sizes and delivery address
        carefully before you pay.
      </p>
      <p>
        If we are unable to supply an item ourselves — for example it is out of stock or we
        cannot deliver to your pincode — we will offer you a replacement of equal value or,
        where no replacement is possible, return the amount paid for that item to the
        original payment method. This is the only situation in which money is returned,
        and it arises from our inability to supply, not from a request to cancel.
      </p>

      <h2>3. Replacement for damage in transit</h2>
      <p>
        We replace an item only when it <strong>arrived damaged</strong> — broken, cracked
        or leaking on delivery. Nothing else qualifies. In particular, we do not replace:
      </p>
      <ul>
        <li>a fragrance you did not like, or that smells different from what you expected;</li>
        <li>
          natural variation in colour, thickness or strength between lots — this is a
          property of genuine attar and not a defect;
        </li>
        <li>a bottle that was damaged after delivery, or while being opened or used;</li>
        <li>any claim that is not supported by the unboxing video described below.</li>
      </ul>

      <h2>4. The unboxing video is mandatory</h2>
      <p>
        Every replacement claim, without exception, must be supported by{' '}
        <strong>
          one continuous, unedited video that starts before the sealed parcel is opened
          and runs until the damage is clearly shown
        </strong>
        . The video must show:
      </p>
      <ul>
        <li>the sealed outer packaging, including the courier label with our shipping label visible;</li>
        <li>the package being opened, in a single uninterrupted take;</li>
        <li>each item being removed from the packaging;</li>
        <li>the damage to the item, clearly and close up.</li>
      </ul>
      <p>
        A video that starts after the parcel is already open, that is cut or edited, or
        that does not show the courier label cannot be accepted, and the claim will be
        declined. We strongly recommend recording the opening of every parcel you receive
        from us, whether or not you expect a problem.
      </p>

      <h2>5. How to claim a replacement</h2>
      <p>
        Claims must be raised within <strong>{SHOP.returnWindowDays} days of delivery</strong>,
        in the following order:
      </p>
      <ol>
        <li>
          <strong>Submit a complaint first.</strong> Use the form on our{' '}
          <Link href="/contact">Contact page</Link>, quoting your order number and stating
          that the item arrived damaged. You will be shown a <strong>complaint ID</strong>{' '}
          on screen as soon as the complaint is submitted. Keep it.
        </li>
        <li>
          <strong>Then email the video.</strong> Send the complete unboxing video to{' '}
          <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> with the complaint ID and your
          order number in the subject line. If the file is too large to attach, share it
          through Google Drive or a similar link that we can open without signing in.
        </li>
      </ol>
      <p>
        A claim is not open until both steps are complete: a complaint without the video,
        or a video sent without a complaint ID, will not be processed. Please keep the
        damaged item and all packaging until we have replied.
      </p>

      <h2>6. What happens next</h2>
      <p>
        We review the video and reply by email, normally within 3 working days. If the
        claim is accepted we despatch a replacement of the same fragrance and size at no
        charge, and you receive tracking details in the usual way. We may ask you to send
        the damaged item back; if we do, we arrange and pay for the collection.
      </p>
      <p>
        If the same fragrance or size is no longer available, we will offer an alternative
        of equal value. A replacement is the only remedy: an accepted claim is never
        converted into a refund.
      </p>

      <h2>7. Failed and refused deliveries</h2>
      <p>
        Couriers normally attempt delivery twice and call before each attempt, which is why
        we ask for an alternate number at checkout. If a parcel comes back to us because
        the address was incomplete, nobody was available, or delivery was refused,{' '}
        <strong>no refund is made</strong>. We will contact you to arrange re-despatch,
        which is charged at the normal shipping rate.
      </p>

      <h2>8. Questions</h2>
      <p>
        Write to <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> or call +91{' '}
        {SHOP.phones[0]} or +91 {SHOP.phones[1]}, {SHOP.hours}. We are a small house and a
        person will read your message.
      </p>
      <p>
        See also our <Link href="/policies/shipping">Shipping Policy</Link> and{' '}
        <Link href="/policies/terms">Terms &amp; Conditions</Link>, of which this policy
        forms part.
      </p>
    </PolicyPage>
  );
}
