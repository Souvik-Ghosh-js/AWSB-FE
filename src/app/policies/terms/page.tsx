import type { Metadata } from 'next';
import Link from 'next/link';

import { PolicyPage } from '@/components/PolicyPage';
import { SHOP } from '@/lib/shop';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: `The terms governing purchases from ${SHOP.name}, ${SHOP.addressLine}.`,
  alternates: { canonical: '/policies/terms' },
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro={`These terms govern your use of this website and any purchase you make from ${SHOP.name}. Please read them before placing an order.`}
    >
      <h2>1. Who you are dealing with</h2>
      <p>
        This website is owned and operated by {SHOP.name}, a sole proprietorship trading
        from {SHOP.addressLine}. Throughout these terms, &ldquo;we&rdquo;, &ldquo;us&rdquo;
        and &ldquo;our&rdquo; mean {SHOP.name}, and &ldquo;you&rdquo; means the person
        placing an order or browsing this site.
      </p>
      <p>
        You can reach us at{' '}
        <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> or on +91 {SHOP.phones[0]} and
        +91 {SHOP.phones[1]}, {SHOP.hours}.
      </p>

      <h2>2. Our products</h2>
      <p>
        We sell attars — concentrated, alcohol-free perfume oils — in 3ml, 6ml and 12ml
        bottles. Each size is priced and stocked separately.
      </p>
      <p>
        Attar is a natural product. Colour, viscosity and the precise character of a
        fragrance vary a little from lot to lot, and photographs on this site are
        indicative rather than exact. This variation is a property of genuine attar and
        is not a defect.
      </p>
      <p>
        <strong>Product images.</strong> We photograph our own stock wherever we can, but
        some images on this site may be representative, stylised or AI-generated rather
        than a photograph of the exact bottle you will receive. The label design, cap
        colour, bottle shape and outer packaging of the item delivered to you may differ
        from what is shown on the product page. This does not affect the fragrance,
        volume or quality of what you ordered.
      </p>
      <p>
        Our products are cosmetic goods for external use on the skin. They are not
        medicines and make no therapeutic claim. If you have sensitive skin or a known
        fragrance allergy, test a small amount on your inner arm first. Keep all bottles
        away from children, heat and direct sunlight.
      </p>

      <h2>3. Prices and payment</h2>
      <p>
        All prices are shown in Indian Rupees (INR) and are the final price of the goods.{' '}
        <strong>
          We are not registered for GST, so no tax is added to your order and no tax
          invoice or GSTIN is issued.
        </strong>{' '}
        Your receipt is a plain receipt.
      </p>
      <p>
        Shipping is charged separately and is calculated from your delivery pincode at
        checkout — see our{' '}
        <Link href="/policies/shipping">Shipping Policy</Link>.
      </p>
      <p>
        Payment is processed entirely by Razorpay Software Private Limited. We accept
        UPI, credit and debit cards, netbanking and wallets.{' '}
        <strong>We do not offer cash on delivery.</strong> We never see or store your
        card or UPI credentials; they are handled by Razorpay under their own security
        standards.
      </p>
      <p>
        Prices may change at any time, but the price shown when you complete payment is
        the price you pay for that order.
      </p>

      <h2>4. Placing an order</h2>
      <p>
        Adding items to your cart is not a purchase. A contract of sale is formed only
        when your payment is successfully received and we send you an order confirmation
        by email.
      </p>
      <p>
        When you begin checkout we reserve the stock for your order for{' '}
        {SHOP.reservationMinutes} minutes. If payment is not completed within that time,
        the reservation is released and the items return to general stock.
      </p>
      <p>
        <strong>Once payment has been made an order cannot be cancelled by you</strong>,
        because we do not offer refunds (see section 6). Please check your items, sizes and
        address before paying.
      </p>
      <p>
        We may decline or cancel an order ourselves if: the item is out of stock; the
        listed price or description was materially wrong; we cannot deliver to your
        address; or we reasonably believe the order is fraudulent. In that case we offer a
        replacement of equal value or, where none is possible, return the amount paid to
        the original payment method. This is the only circumstance in which money is
        returned.
      </p>

      <h2>5. Your address</h2>
      <p>
        You are responsible for the accuracy of the delivery address, phone number and
        email address you give us. Our checkout requires a complete address — house or
        flat number and building, city, state and a valid 6-digit pincode — because
        incomplete addresses are the single largest cause of failed delivery.
      </p>
      <p>
        If a parcel is returned to us because the address was wrong or incomplete, or
        because nobody was available to receive it after the courier&rsquo;s attempts,{' '}
        <strong>no refund is made</strong>. We will contact you to arrange re-despatch,
        which is charged at the normal shipping rate.
      </p>

      <h2>6. No refunds; replacement of damaged items</h2>
      <p>
        <strong>
          We do not offer refunds. No product is refunded, in full or in part, for any
          reason, and a paid order cannot be cancelled.
        </strong>{' '}
        Our only remedy is the replacement of an item that arrived damaged in transit.
      </p>
      <p>
        A replacement claim is accepted only if all of the following are met:
      </p>
      <ul>
        <li>the item was damaged on arrival — broken, cracked or leaking when delivered;</li>
        <li>
          the claim is supported by one continuous, unedited video that begins before the
          sealed parcel is opened, shows the courier label, and runs until the damage is
          clearly shown;
        </li>
        <li>
          you first submit a complaint through our <Link href="/contact">Contact page</Link>{' '}
          and receive a complaint ID, and then email the video to{' '}
          <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> quoting that complaint ID;
        </li>
        <li>the claim is raised within {SHOP.returnWindowDays} days of delivery.</li>
      </ul>
      <p>
        Claims that do not meet every condition are declined. An accepted claim is settled
        by replacement only and is never converted into a refund. The full procedure is in
        our <Link href="/policies/refund">Refund, Cancellation &amp; Replacement Policy</Link>,
        which forms part of these terms.
      </p>

      <h2>7. Reviews and submissions</h2>
      <p>
        Reviews may be left only by customers with a delivered order for that product,
        and are published after moderation. We may decline to publish, or remove, any
        review that is abusive, defamatory, contains personal information, or is not a
        genuine account of the product.
      </p>
      <p>
        By submitting a review or other content you grant us a non-exclusive, royalty-free
        licence to display it on this site.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        All content on this site — text, photography, the {SHOP.name} name and mark, and
        the site design — belongs to us or our licensors. You may not copy, reproduce or
        use it commercially without our written permission.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        Nothing in these terms excludes liability that cannot lawfully be excluded,
        including liability for death or personal injury caused by our negligence, or for
        fraud.
      </p>
      <p>
        Subject to that, our total liability arising out of any order is limited to the
        amount you paid for that order. We are not liable for indirect or consequential
        loss, and we are not liable for delays caused by events outside our reasonable
        control — including courier disruption, strikes, natural events and government
        action.
      </p>

      <h2>10. Privacy</h2>
      <p>
        How we handle your personal information is set out in our{' '}
        <Link href="/policies/privacy">Privacy Policy</Link>.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Any dispute is subject to the
        exclusive jurisdiction of the courts at Kolkata, West Bengal.
      </p>

      <h2>12. Changes to these terms</h2>
      <p>
        We may update these terms from time to time. The version published on this page
        when you place your order is the version that applies to that order.
      </p>
    </PolicyPage>
  );
}
