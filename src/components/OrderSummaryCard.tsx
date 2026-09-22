import { formatDateTime, formatPaise, orderStatusLabel } from '@/lib/format';
import type { Order } from '@/lib/types';
import { StatusBadge } from './ui';

/**
 * The full order, as the customer sees it — used by both the confirmation
 * page and the guest tracking page so the two never drift apart.
 *
 * Matches GET /orders/track exactly (confirmed live) — a privacy-reduced
 * view, since this endpoint is only guarded by a guessable order number
 * plus an email match. There is no coupon code, customer note, full
 * address, phone or email here: `shippingTo` is name/city/state/pincode
 * only, by the API's deliberate design, not an omission to work around.
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
                  <p className="text-[0.9375rem]">{item.productName}</p>
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
              value={formatPaise(order.totals.subtotalPaise, { compact: true })}
            />
            {order.totals.discountPaise > 0 ? (
              <TotalRow
                label="Discount"
                value={`−${formatPaise(order.totals.discountPaise, { compact: true })}`}
                accent
              />
            ) : null}
            <TotalRow
              label="Shipping"
              value={
                order.totals.shippingPaise === 0
                  ? 'Free'
                  : formatPaise(order.totals.shippingPaise, { compact: true })
              }
            />
          </dl>

          <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <span className="text-[0.9375rem]">Total paid</span>
            <span className="aw-price text-xl">
              {formatPaise(order.totals.totalPaise, { compact: true })}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------- delivery + tracking */}
      <div className="lg:col-span-5">
        {/* Tracking */}
        {order.tracking ? (
          <div className="aw-card mb-6 p-6 sm:p-7">
            <h2 className="text-lg">Tracking</h2>
            <hr className="aw-rule mt-3" />

            <dl className="mt-5 space-y-3">
              <div>
                <dt className="aw-eyebrow mb-1">Courier</dt>
                <dd className="text-[0.9375rem]">{order.tracking.courierName}</dd>
              </div>
              <div>
                <dt className="aw-eyebrow mb-1">Tracking number</dt>
                {/* Shown large and copyable: for CAPTCHA-gated couriers this
                    number IS the tracking experience, not the link. */}
                <dd className="aw-tabular font-[family-name:var(--font-display)] text-xl break-all text-brand select-all">
                  {order.tracking.trackingNumber}
                </dd>
              </div>
              {order.tracking.shippedAt ? (
                <div>
                  <dt className="aw-eyebrow mb-1">Dispatched</dt>
                  <dd className="text-[0.8125rem] text-muted">
                    {formatDateTime(order.tracking.shippedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>

            {order.tracking.trackingUrl && order.tracking.supportsDeepLink ? (
              <a
                href={order.tracking.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="aw-btn aw-btn-outline aw-btn-sm mt-5 w-full"
              >
                Track this parcel
              </a>
            ) : order.tracking.trackingUrl ? (
              <>
                <a
                  href={order.tracking.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aw-btn aw-btn-outline aw-btn-sm mt-5 w-full"
                >
                  Open {order.tracking.courierName} tracking
                </a>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  This courier asks you to enter the number yourself — copy the tracking
                  number above into their form.
                </p>
              </>
            ) : null}
          </div>
        ) : null}

        {/* Delivery address — name, city, state, pincode only; the API never
            sends the full street address, phone or email back here. */}
        <div className="aw-card p-6 sm:p-7">
          <h2 className="text-lg">Delivering to</h2>
          <hr className="aw-rule mt-3" />

          <address className="mt-5 text-[0.875rem] leading-relaxed text-ink not-italic">
            <span className="block font-medium">{order.shippingTo.name}</span>
            <span className="block text-muted">
              {order.shippingTo.city}, {order.shippingTo.state} {order.shippingTo.pincode}
            </span>
          </address>
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
 *
 * GET /orders/track has no cancelledAt/cancelReason field, so the cancelled
 * step can only be marked done, not dated.
 */
function buildTimeline(order: Order): { label: string; at: string | null; done: boolean }[] {
  if (order.status === 'cancelled' || order.status === 'refunded') {
    return [
      { label: 'Order placed', at: order.placedAt, done: Boolean(order.placedAt) },
      {
        label: orderStatusLabel(order.status),
        at: null,
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
