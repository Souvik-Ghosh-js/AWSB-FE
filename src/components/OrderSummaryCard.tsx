import Link from 'next/link';

import { formatDateTime, formatPaise, formatPhone, orderStatusLabel } from '@/lib/format';
import type { Order } from '@/lib/types';
import { StatusBadge } from './ui';

/**
 * The full order, as the customer sees it — used by both the confirmation
 * page and the guest tracking page so the two never drift apart.
 *
 * No GSTIN, HSN or tax breakdown appears: the shop is not GST registered and
 * this is a plain receipt, not a tax invoice.
 */
export function OrderSummaryCard({ order }: { order: Order }) {
  return (
    <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
      {/* ------------------------------------------------------- the items */}
      <div className="lg:col-span-7">
        <div className="aw-card p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl">Order {order.orderNumber}</h2>
            <StatusBadge status={order.status} />
          </div>
          <hr className="aw-rule mt-4" />

          <ul className="mt-6 divide-y divide-line">
            {order.items.map((item, i) => (
              <li key={`${item.sku}-${i}`} className="flex gap-4 py-4 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem]">
                    {item.productSlug ? (
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="transition-colors hover:text-brand-soft"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      item.productName
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {item.sizeMl} ml · {formatPaise(item.unitPricePaise, { compact: true })}{' '}
                    each · Qty {item.quantity}
                  </p>
                </div>
                <span className="aw-tabular shrink-0 text-[0.9375rem]">
                  {formatPaise(item.lineTotalPaise, { compact: true })}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-6 space-y-2.5 border-t border-line pt-5">
            <TotalRow
              label="Subtotal"
              value={formatPaise(order.subtotalPaise, { compact: true })}
            />
            {order.discountPaise > 0 ? (
              <TotalRow
                label={order.couponCode ? `Discount (${order.couponCode})` : 'Discount'}
                value={`−${formatPaise(order.discountPaise, { compact: true })}`}
                accent
              />
            ) : null}
            <TotalRow
              label={`Shipping · ${order.shipZone === 'kolkata' ? 'Kolkata' : 'Rest of India'}`}
              value={
                order.shippingPaise === 0
                  ? 'Free'
                  : formatPaise(order.shippingPaise, { compact: true })
              }
            />
          </dl>

          <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <span className="text-[0.9375rem]">Total paid</span>
            <span className="aw-price text-xl">
              {formatPaise(order.totalPaise, { compact: true })}
            </span>
          </div>

          {order.customerNote ? (
            <div className="mt-6 border-t border-line pt-5">
              <p className="aw-eyebrow mb-2">Your note</p>
              <p className="text-[0.8125rem] leading-relaxed text-muted">
                {order.customerNote}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* ------------------------------------------- delivery + tracking */}
      <div className="lg:col-span-5">
        {/* Tracking */}
        {order.shipment ? (
          <div className="aw-card mb-6 p-6 sm:p-7">
            <h2 className="text-lg">Tracking</h2>
            <hr className="aw-rule mt-3" />

            <dl className="mt-5 space-y-3">
              <div>
                <dt className="aw-eyebrow mb-1">Courier</dt>
                <dd className="text-[0.9375rem]">{order.shipment.courierName}</dd>
              </div>
              <div>
                <dt className="aw-eyebrow mb-1">Tracking number</dt>
                {/* Shown large and copyable: for CAPTCHA-gated couriers this
                    number IS the tracking experience, not the link. */}
                <dd className="aw-tabular font-[family-name:var(--font-display)] text-xl break-all text-brand select-all">
                  {order.shipment.trackingNumber}
                </dd>
              </div>
              {order.shipment.shippedAt ? (
                <div>
                  <dt className="aw-eyebrow mb-1">Dispatched</dt>
                  <dd className="text-[0.8125rem] text-muted">
                    {formatDateTime(order.shipment.shippedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>

            {order.shipment.trackingUrl && order.shipment.supportsDeepLink ? (
              <a
                href={order.shipment.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="aw-btn aw-btn-outline aw-btn-sm mt-5 w-full"
              >
                Track this parcel
              </a>
            ) : order.shipment.trackingUrl ? (
              <>
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aw-btn aw-btn-outline aw-btn-sm mt-5 w-full"
                >
                  Open {order.shipment.courierName} tracking
                </a>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  This courier asks you to enter the number yourself — copy the tracking
                  number above into their form.
                </p>
              </>
            ) : null}
          </div>
        ) : null}

        {/* Delivery address */}
        <div className="aw-card p-6 sm:p-7">
          <h2 className="text-lg">Delivering to</h2>
          <hr className="aw-rule mt-3" />

          <address className="mt-5 text-[0.875rem] leading-relaxed text-ink not-italic">
            <span className="block font-medium">{order.shippingAddress.fullName}</span>
            <span className="block text-muted">{order.shippingAddress.line1}</span>
            {order.shippingAddress.line2 ? (
              <span className="block text-muted">{order.shippingAddress.line2}</span>
            ) : null}
            {order.shippingAddress.landmark ? (
              <span className="block text-muted">
                Near {order.shippingAddress.landmark}
              </span>
            ) : null}
            <span className="block text-muted">
              {order.shippingAddress.city}
              {order.shippingAddress.district
                ? `, ${order.shippingAddress.district}`
                : ''}
            </span>
            <span className="block text-muted">
              {order.shippingAddress.state} {order.shippingAddress.pincode}
            </span>
          </address>

          <div className="mt-4 space-y-1 border-t border-line pt-4">
            <p className="text-[0.8125rem] text-muted">
              {formatPhone(order.shippingAddress.phone)}
              {order.shippingAddress.altPhone
                ? ` · ${formatPhone(order.shippingAddress.altPhone)}`
                : ''}
            </p>
            <p className="text-[0.8125rem] break-all text-muted">
              {order.shippingAddress.email}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="aw-card mt-6 p-6 sm:p-7">
          <h2 className="text-lg">Progress</h2>
          <hr className="aw-rule mt-3" />

          <ol className="mt-5 space-y-4">
            {buildTimeline(order).map((step) => (
              <li key={step.label} className="flex gap-3">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    step.done ? 'bg-accent' : 'bg-line-strong'
                  }`}
                />
                <div>
                  <p
                    className={`text-[0.875rem] ${step.done ? 'text-ink' : 'text-muted'}`}
                  >
                    {step.label}
                  </p>
                  {step.at ? (
                    <p className="text-xs text-muted">{formatDateTime(step.at)}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          {order.status === 'cancelled' && order.cancelReason ? (
            <p className="mt-5 border-t border-line pt-4 text-[0.8125rem] text-muted">
              Reason: {order.cancelReason}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[0.8125rem] text-muted">{label}</dt>
      <dd className={`aw-tabular text-[0.875rem] ${accent ? 'text-brand-soft' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

/**
 * The lifecycle, as the customer experiences it. Cancelled orders get their
 * own short path rather than showing shipping steps that will never happen.
 */
function buildTimeline(order: Order): { label: string; at: string | null; done: boolean }[] {
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return [
      { label: 'Order placed', at: order.placedAt, done: Boolean(order.placedAt) },
      {
        label: orderStatusLabel(order.status),
        at: order.cancelledAt,
        done: true,
      },
    ];
  }

  const reached = (statuses: Order['status'][]) => statuses.includes(order.status);

  return [
    {
      label: 'Order placed',
      at: order.placedAt,
      done: Boolean(order.placedAt),
    },
    {
      label: 'Confirmed and being packed',
      at: null,
      done: reached(['confirmed', 'packed', 'shipped', 'delivered']),
    },
    {
      label: 'Dispatched',
      at: order.shippedAt,
      done: reached(['shipped', 'delivered']),
    },
    {
      label: 'Delivered',
      at: order.deliveredAt,
      done: order.status === 'delivered',
    },
  ];
}
