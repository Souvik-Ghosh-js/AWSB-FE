import type { Metadata } from 'next';
import Link from 'next/link';

import { PolicyPage } from '@/components/PolicyPage';
import { SHOP } from '@/lib/shop';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SHOP.name} collects, uses and protects your personal information.`,
  alternates: { canonical: '/policies/privacy' },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="What we collect, why we collect it, who we share it with, and how to ask us to delete it."
    >
      <h2>1. Who is responsible for your data</h2>
      <p>
        {SHOP.name}, of {SHOP.addressLine}, decides how and why your personal information
        is processed. For any question about this policy, or to exercise any of the
        rights below, write to <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a>.
      </p>

      <h2>2. What we collect</h2>
      <p>When you place an order we collect:</p>
      <ul>
        <li>Your name, email address and mobile number (and an alternate number, if you give one)</li>
        <li>
          Your full delivery address — house or flat number and building, area, landmark,
          city, district, state and pincode
        </li>
        <li>What you ordered, what you paid, and when</li>
        <li>Any note you add to your order, and any message you send us</li>
      </ul>
      <p>
        <strong>We never collect or store your card number, CVV, UPI PIN or netbanking
        credentials.</strong>{' '}
        Payment details are entered directly into Razorpay&rsquo;s secure checkout and are
        never visible to us. We receive only a payment reference, the method used (for
        example &ldquo;UPI&rdquo;), and whether the payment succeeded.
      </p>
      <p>
        If you contact us or leave a product review, we keep that correspondence and the
        name you publish it under.
      </p>
      <p>
        Our servers also record ordinary technical information — IP address, browser type
        and pages requested — which is used to keep the site secure and working.
      </p>

      <h2>3. Why we use it</h2>
      <ul>
        <li>
          <strong>To fulfil your order</strong> — to take payment, pack and despatch your
          parcel, and give the courier the address and phone number they need to deliver
          it.
        </li>
        <li>
          <strong>To keep you informed</strong> — order confirmation, despatch and
          tracking, delivery confirmation, and cancellation or refund notices.
        </li>
        <li>
          <strong>To answer you</strong> — when you write to us about an order or a
          product.
        </li>
        <li>
          <strong>To meet our obligations</strong> — keeping records of sales as the law
          requires, and handling payment disputes.
        </li>
        <li>
          <strong>To protect the shop</strong> — detecting and preventing fraudulent
          orders.
        </li>
      </ul>
      <p>
        We send marketing email only if you have expressly opted in, and every such email
        carries an unsubscribe link.
      </p>

      <h2>4. Who we share it with</h2>
      <p>We share the minimum necessary, and only with:</p>
      <ul>
        <li>
          <strong>Razorpay</strong>, to process your payment and any refund.
        </li>
        <li>
          <strong>Our courier partners</strong> — Blue Dart, Delhivery, XpressBees, Ekart,
          Amazon Shipping, India Post, DTDC, Professional Couriers or Trackon — who
          receive your name, delivery address and phone number so they can deliver your
          parcel.
        </li>
        <li>
          <strong>Our email provider</strong>, to deliver transactional email.
        </li>
        <li>
          <strong>Our hosting provider</strong> (Amazon Web Services), where the site and
          database run.
        </li>
      </ul>
      <p>
        <strong>We do not sell your personal information, and we never have.</strong> We
        may disclose information where we are legally required to do so.
      </p>

      <h2>5. How long we keep it</h2>
      <p>
        Order records — including the delivery address as it was at the time — are kept
        for eight years, because tax and accounting rules require us to retain records of
        sales. Correspondence is kept for three years. Reviews stay published until you
        ask us to remove them.
      </p>

      <h2>6. Where it is stored, and how it is protected</h2>
      <p>
        Your data is stored on servers located in India. Access is restricted to the
        people who need it to run the shop, administrator accounts are individually
        password-protected, and the connection between your browser and this site is
        encrypted with TLS.
      </p>
      <p>
        No system is perfectly secure, but if a breach ever affects your personal data we
        will tell you and the relevant authority promptly.
      </p>

      <h2>7. Your rights</h2>
      <p>You may ask us to:</p>
      <ul>
        <li>give you a copy of the personal information we hold about you;</li>
        <li>correct anything that is wrong;</li>
        <li>
          delete your information, where we are not required to keep it for tax or legal
          reasons;
        </li>
        <li>stop sending you marketing email.</li>
      </ul>
      <p>
        Write to <a href={`mailto:${SHOP.email}`}>{SHOP.email}</a> and we will respond
        within 30 days. We may ask you to confirm your identity first, so that we do not
        disclose one customer&rsquo;s details to another.
      </p>

      <h2>8. Cookies and local storage</h2>
      <p>
        This site does not use advertising or third-party tracking cookies.
      </p>
      <p>
        Your cart is kept in your own browser&rsquo;s local storage so that it survives a
        page refresh — it stays on your device and is only sent to us when you check out.
        Razorpay sets its own cookies when the payment window opens; those are governed by{' '}
        <a
          href="https://razorpay.com/privacy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Razorpay&rsquo;s privacy policy
        </a>
        .
      </p>

      <h2>9. Children</h2>
      <p>
        This shop is not intended for children under 18, and we do not knowingly collect
        their personal information.
      </p>

      <h2>10. Changes</h2>
      <p>
        If we change this policy we will update the date at the top of this page. Material
        changes affecting how we use your data will be notified by email where we hold
        one.
      </p>
      <p>
        See also our <Link href="/policies/terms">Terms &amp; Conditions</Link>.
      </p>
    </PolicyPage>
  );
}
