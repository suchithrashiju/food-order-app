import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Mail,
  MapPin,
  Package,
  Receipt,
} from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { OrderTimeline } from '@/features/order/components/OrderTimeline'
import { formatCurrency } from '@/lib/utils'
import { orderService } from '@/services/order.service'
import type { EmailNotification, Order } from '@/types'
import type { OrderStatus } from '@/utils/order-status'

interface SuccessLocationState {
  order?: Order
  orderReference?: string
  emailNotification?: EmailNotification
}

export function OrderSuccessPage() {
  const { orderId = '' } = useParams()
  const location = useLocation()
  const locationState = (location.state as SuccessLocationState | null) ?? null
  const orderFromCheckout = locationState?.order

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: Boolean(orderId) && !orderFromCheckout,
    staleTime: Infinity,
  })

  const order = orderFromCheckout ?? orderQuery.data
  const orderReference = order?.orderReference || locationState?.orderReference || '—'
  const emailNotification = order?.emailNotification || locationState?.emailNotification
  const trackTarget = order?.orderReference || orderReference

  const copyReference = async () => {
    if (!orderReference || orderReference === '—') return
    try {
      await navigator.clipboard.writeText(orderReference)
      toast.success('Order reference copied')
    } catch {
      toast.error('Could not copy reference')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-accent to-emerald-700 px-6 py-10 text-center text-white sm:px-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15 ring-4 ring-white/20">
          <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100">
          Order confirmed
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Your order is placed
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-50/90 sm:text-base">
          Sit back and relax — the kitchen is getting started on your meal.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Order Reference
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="font-mono text-xl font-bold text-primary">{orderReference}</p>
              <button
                type="button"
                onClick={() => void copyReference()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                aria-label="Copy order reference"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
            Order Received
          </span>
        </div>

        {order?.items && order.items.length > 0 ? (
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Items Ordered
              </p>
            </div>
            <ul className="space-y-2">
              {order.items.map((item, index) => (
                <li key={`${item.menuItemId}-${index}`} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {item.name}
                    <span className="ml-1 text-slate-400">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {order ? (
          <div className="space-y-1.5 px-5 py-4 text-sm sm:px-6">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery fee</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white">
              <span>Total Paid</span>
              <span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-4 text-sm text-orange-800 dark:border-orange-900/40 dark:bg-orange-950/30 dark:text-orange-200">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Estimated delivery</p>
            <p className="mt-0.5">
              About <strong>{order?.estimatedDeliveryMinutes ?? 35} minutes</strong>
            </p>
          </div>
        </div>

        {order?.delivery ? (
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm dark:border-slate-800 dark:bg-slate-900">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Delivering to</p>
              <p className="mt-0.5 text-slate-500">
                {order.delivery.address}, {order.delivery.city}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {order ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            What’s next
          </h2>
          <OrderTimeline
            currentStatus={(order.status as OrderStatus) || 'Order Received'}
            compact
          />
        </div>
      ) : null}

      {emailNotification ? (
        <div className="flex w-full items-start gap-3 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{emailNotification.message}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-center gap-3 pb-4">
        <Button asChild size="lg">
          <Link to={`/track/${encodeURIComponent(trackTarget)}`}>
            Track Order
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/menu">Browse Menu</Link>
        </Button>
      </div>
    </div>
  )
}
