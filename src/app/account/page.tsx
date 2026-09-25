import type { Metadata } from 'next';

import { AccountView } from '@/components/AccountView';
import { Breadcrumbs } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Your Account',
  description: 'Sign in with a one-time email code to see your order history.',
  // Personal, never indexed — same reasoning as the order confirmation page.
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <div className="aw-container py-10 sm:py-14">
      <Breadcrumbs items={[{ href: '/', label: 'Home' }, { label: 'Account' }]} />
      <div className="mt-10 sm:mt-12">
        <AccountView />
      </div>
    </div>
  );
}
