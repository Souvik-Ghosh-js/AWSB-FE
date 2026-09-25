'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { ApiError, getMyOrderDetail, getMyOrders } from '@/lib/api';
import { clearCustomerSession, getCustomer, getToken, subscribeToCustomerSession } from '@/lib/customer-auth';
import { formatDate, formatPaise, formatSize } from '@/lib/format';
import type { MyOrder, MyOrderDetail } from '@/lib/types';
import { EmptyState, LineSkeleton, StatusBadge } from './ui';
import { LoginForm } from './LoginForm';
import { ReplacementRequestForm } from './ReplacementRequestForm';

/**
 * Account: signed-out shows the OTP login form, signed-in shows order
 * history. Order history matches both orders placed while signed in and past
 * guest checkouts with the same email — see listMyOrders on the API — so
 * signing in for the first time still shows everything already ordered.
 */
export function AccountView() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setSignedIn(getCustomer() !== null);
    sync();
    return subscribeToCustomerSession(sync);
  }, []);

  if (signedIn === null) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <LineSkeleton className="h-6 w-40" />
        <LineSkeleton className="h-32 w-full" />
      </div>
    );
  }

  return signedIn ? <OrderHistory /> : <LoginForm onSignedIn={() => setSignedIn(true)} />;
}

function OrderHistory() {
  const customer = getCustomer();
  const [orders, setOrders] = useState<MyOrder[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const page = await getMyOrders(token, { limit: 50 });
      setOrders(page.items);
    } catch (err) {
      setError(err instanceof ApiError ? err.friendlyMessage : 'Could not load your orders just now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="text-2xl">Your orders</h1>
          {customer ? <p className="mt-1 text-[0.8125rem] text-muted">{customer.email}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => clearCustomerSession()}
          className="aw-btn aw-btn-outline aw-btn-sm"
        >
          Sign out
        </button>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-3">
            <LineSkeleton className="h-20 w-full" />
            <LineSkeleton className="h-20 w-full" />
            <LineSkeleton className="h-20 w-full" />
          </div>
        ) : error ? (
          <div className="aw-card flex flex-col items-center px-6 py-14 text-center">
            <p className="aw-error" role="alert">
              {error}
            </p>
            <button type="button" onClick={() => void load()} className="aw-btn aw-btn-outline aw-btn-sm mt-5">
              Try again
            </button>
          </div>
        ) : !orders || orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            message="Once you place an order with this email, it will show up here."
            action={
              <Link href="/shop" className="aw-btn aw-btn-primary aw-btn-sm">
                Shop attars
              </Link>
            }
          />
        ) : (
          <ul className="space-y-3">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: MyOrder }) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<MyOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState<Record<number, string>>({});

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !detail) {
      const token = getToken();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        setDetail(await getMyOrderDetail(token, order.id));
      } catch (err) {
        setError(err instanceof ApiError ? err.friendlyMessage : 'Could not load this order just now.');
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <li className="aw-card p-4 sm:p-5">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
      >
        <div>
          <p className="font-medium text-ink">{order.orderNumber}</p>
          <p className="mt-1 text-[0.8125rem] text-muted">
            {order.placedAt ? formatDate(order.placedAt) : formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="aw-tabular text-sm">{formatPaise(order.totalPaise, { compact: true })}</span>
          <StatusBadge status={order.status} />
        </div>
      </button>

      {open ? (
        <div className="mt-4 border-t border-line pt-4">
          {loading ? (
            <LineSkeleton className="h-16 w-full" />
          ) : error ? (
            <p className="aw-error" role="alert">
              {error}
            </p>
          ) : detail ? (
            <ul className="space-y-4">
              {detail.items.map((item) => (
                <li key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[0.9375rem]">{item.productName}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {formatSize(item.sizeMl, item.sizeUnit)} · Qty {item.quantity}
                      </p>
                    </div>
                    {order.status === 'delivered' ? (
                      submitted[item.id] ? (
                        <span className="text-xs text-muted">
                          Request {submitted[item.id]} submitted
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenItemId(openItemId === item.id ? null : item.id)}
                          className="aw-btn aw-btn-outline aw-btn-sm"
                        >
                          {openItemId === item.id ? 'Cancel' : 'Request replacement'}
                        </button>
                      )
                    ) : null}
                  </div>

                  {openItemId === item.id ? (
                    <ReplacementRequestForm
                      orderItemId={item.id}
                      onDone={(requestNumber) => {
                        setSubmitted((prev) => ({ ...prev, [item.id]: requestNumber }));
                        setOpenItemId(null);
                      }}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
