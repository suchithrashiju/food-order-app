import { useQuery } from '@tanstack/react-query'
import { Clock, MapPin, Package, Receipt, RefreshCw, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OrderTimeline } from '@/features/order/components/OrderTimeline'
import { getErrorMessage } from '@/lib/api-client'
import { orderService } from '@/services/order.service'
import type { OrderStatus } from '@/types'

function fmt(amount: number) {
  return `₹${amount.toFixed(2)}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  'Order Received': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Preparing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'Out for Delivery': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
}

export function TrackOrderPage() {
  const navigate = useNavigate()
  const { orderId: routeOrderId } = useParams()
  const [inputId, setInputId] = useState(routeOrderId ?? '')
  const activeId = routeOrderId ?? ''

  const orderQuery = useQuery({
    queryKey: ['order', activeId],
    queryFn: () => orderService.getOrderById(activeId),
    enabled: Boolean(activeId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status && status !== 'Delivered' ? 4000 : false
    },
  })

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = inputId.trim()
    if (trimmed) {
      navigate(`/track/${encodeURIComponent(trimmed)}`)
    }
  }

  const order = orderQuery.data

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Track Order</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Enter your order reference number to follow live status updates.
        </p>
      </header>

      {/* Search form */}
      <Card>
        <CardContent className="p-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="orderId">Order reference number</Label>
              <Input
                id="orderId"
                value={inputId}
                onChange={(event) => setInputId(event.target.value)}
                placeholder="e.g. FO-260805-A3K9X2"
                className="font-mono uppercase"
              />
            </div>
            <Button type="submit" className="sm:shrink-0">
              Track Order
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Empty state */}
      {!activeId && (
        <EmptyState
          title="No order selected"
          description="Place an order or paste your order reference above to start tracking."
        />
      )}

      {/* Loading */}
      {activeId && orderQuery.isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Looking up order…
        </div>
      )}

      {/* Error */}
      {activeId && orderQuery.isError && (
        <EmptyState
          title="Order not found"
          description={getErrorMessage(orderQuery.error)}
          actionLabel="Try again"
          onAction={() => void orderQuery.refetch()}
        />
      )}

      {/* Order details */}
      {order && (
        <div className="space-y-4">
          {/* Reference + status header */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Order Reference
              </p>
              <p className="mt-0.5 font-mono text-xl font-bold text-primary">
                {order.orderReference}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLOR[order.status as OrderStatus] ?? ''}`}
            >
              {order.status}
            </span>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline currentStatus={order.status as OrderStatus} />
              {order.status !== 'Delivered' && (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Estimated delivery in{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {order.estimatedDeliveryMinutes} minutes
                  </strong>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Items + price */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-4 w-4 text-primary" />
                Items Ordered
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {order.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-slate-700 dark:text-slate-300">
                      {item.name}
                      <span className="ml-1 text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {fmt(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-1.5 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery fee</span>
                  <span>{fmt(order.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax</span>
                  <span>{fmt(order.tax)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 dark:border-slate-700 dark:text-white">
                  <span>Total</span>
                  <span className="text-primary">{fmt(order.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Delivery Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <span>{order.delivery.name}</span>
                {order.delivery.phone && (
                  <span className="text-slate-400">· {order.delivery.phone}</span>
                )}
              </div>
              <div className="flex items-start gap-2">
                <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <span>
                  {order.delivery.address}, {order.delivery.city} – {order.delivery.postalCode}
                </span>
              </div>
              {order.delivery.notes && (
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800">
                  Note: {order.delivery.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}
