import { useQuery } from '@tanstack/react-query'
import {
  Clock,
  Copy,
  MapPin,
  Package,
  Phone,
  Radio,
  RefreshCw,
  Search,
  User,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OrderTimeline } from '@/features/order/components/OrderTimeline'
import { useOrderStatusSocket } from '@/hooks/useOrderStatusSocket'
import { getErrorMessage } from '@/lib/api-client'
import { cn, formatCurrency } from '@/lib/utils'
import { orderService } from '@/services/order.service'
import { isOrderClosed, type OrderStatus } from '@/utils/order-status'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  'Order Received': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  Preparing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  'Out for Delivery': 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  Delivered: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  Cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}

export function TrackOrderPage() {
  const navigate = useNavigate()
  const { orderId: routeOrderId } = useParams()
  const [inputId, setInputId] = useState(routeOrderId ?? '')
  const activeId = routeOrderId ?? ''

  useEffect(() => {
    setInputId(routeOrderId ?? '')
  }, [routeOrderId])

  const orderQuery = useQuery({
    queryKey: ['order', activeId],
    queryFn: () => orderService.getOrderById(activeId),
    enabled: Boolean(activeId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && !isOrderClosed(status) ? 8000 : false
    },
  })

  useOrderStatusSocket(
    activeId || undefined,
    orderQuery.data?.status as OrderStatus | undefined,
  )

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = inputId.trim()
    if (trimmed) {
      navigate(`/track/${encodeURIComponent(trimmed)}`)
    }
  }

  const onClear = () => {
    setInputId('')
    navigate('/track')
  }

  const order = orderQuery.data
  const live = Boolean(order && !isOrderClosed(order.status as OrderStatus))
  const cancellationReason =
    order?.status === 'Cancelled'
      ? [...(order.statusHistory ?? [])]
          .reverse()
          .find((entry) => entry.status === 'Cancelled')?.remarks
      : undefined

  const copyReference = async () => {
    if (!order?.orderReference) return
    try {
      await navigator.clipboard.writeText(order.orderReference)
      toast.success('Order reference copied')
    } catch {
      toast.error('Could not copy reference')
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 px-6 py-8 text-white sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
          Live tracking
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Track your order</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
          Enter your order reference to follow kitchen prep and delivery in real time.
        </p>
      </header>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <form className="flex flex-col gap-4 sm:flex-row sm:items-end" onSubmit={onSubmit}>
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="orderId">Order reference number</Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <Input
                id="orderId"
                value={inputId}
                onChange={(event) => setInputId(event.target.value)}
                placeholder="e.g. FO-260805-A3K9X2"
                className="pl-10 font-mono uppercase"
              />
            </div>
          </div>
          <div className="flex gap-2 sm:shrink-0">
            <Button type="submit" size="lg">
              Track Order
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onClear}
              disabled={!inputId && !activeId}
            >
              Clear
            </Button>
          </div>
        </form>
      </div>

      {!activeId && (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">No order selected</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Place an order or paste your order reference above to start tracking.
          </p>
          <Button asChild className="mt-6">
            <Link to="/menu">Browse menu</Link>
          </Button>
        </div>
      )}

      {activeId && orderQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-10 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
          Looking up order…
        </div>
      )}

      {activeId && orderQuery.isError && (
        <EmptyState
          title="Order not found"
          description={getErrorMessage(orderQuery.error)}
          actionLabel="Try again"
          onAction={() => void orderQuery.refetch()}
        />
      )}

      {order && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Order Reference
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-2xl font-bold text-primary">{order.orderReference}</p>
                  <button
                    type="button"
                    onClick={() => void copyReference()}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    aria-label="Copy order reference"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-400">Placed on {formatDate(order.createdAt)}</p>
              </div>

              <div className="flex flex-col items-end gap-2">
                <span
                  className={cn(
                    'rounded-full px-3 py-1 text-sm font-semibold',
                    STATUS_COLOR[order.status as OrderStatus] ?? '',
                  )}
                >
                  {order.status}
                </span>
                {live ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                    <Radio className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
                    Live updates on
                  </span>
                ) : null}
              </div>
            </div>

            {!isOrderClosed(order.status as OrderStatus) ? (
              <div className="flex items-center gap-3 bg-orange-50 px-5 py-3 text-sm text-orange-800 dark:bg-orange-950/30 dark:text-orange-200 sm:px-6">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Estimated delivery in{' '}
                  <strong>{order.estimatedDeliveryMinutes} minutes</strong>
                </span>
              </div>
            ) : null}

            <div className="px-5 py-5 sm:px-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                Order Status
              </h2>
              <OrderTimeline
                currentStatus={order.status as OrderStatus}
                cancellationReason={cancellationReason}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                Delivery to
              </h2>
              <div className="space-y-3 text-sm">
                <p className="inline-flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                  <User className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {order.delivery.name}
                </p>
                <p className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Phone className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {order.delivery.phone}
                </p>
                <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                  {order.delivery.address}
                  <br />
                  {order.delivery.city}, {order.delivery.postalCode}
                </p>
                {order.delivery.notes ? (
                  <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-500 dark:bg-slate-800/80">
                    Note: {order.delivery.notes}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
                <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                Order items
              </h2>
              <ul className="space-y-2.5 text-sm">
                {order.items.map((item, index) => (
                  <li key={`${item.menuItemId}-${index}`} className="flex justify-between gap-3">
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.name}
                      <span className="ml-1 text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery</span>
                  <span>{formatCurrency(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>{formatCurrency(order.tax)}</span>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to="/menu">Order again</Link>
            </Button>
            <Button variant="ghost" onClick={() => void orderQuery.refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh status
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
