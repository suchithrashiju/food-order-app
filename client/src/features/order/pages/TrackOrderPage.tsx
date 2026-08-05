import { useQuery } from '@tanstack/react-query'
import { Clock, RefreshCw } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { OrderTimeline } from '@/features/order/components/OrderTimeline'
import { getErrorMessage } from '@/lib/api-client'
import { orderService } from '@/services/order.service'
import { isOrderClosed, type OrderStatus } from '@/utils/order-status'

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
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
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
      return status && !isOrderClosed(status) ? 4000 : false
    },
  })

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
  const cancellationReason =
    order?.status === 'Cancelled'
      ? [...(order.statusHistory ?? [])]
          .reverse()
          .find((entry) => entry.status === 'Cancelled')?.remarks
      : undefined

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Track Order</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">
          Enter your order reference number to follow live status updates.
        </p>
      </header>

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
            <div className="flex gap-2 sm:shrink-0">
              <Button type="submit">Track Order</Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClear}
                disabled={!inputId && !activeId}
              >
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {!activeId && (
        <EmptyState
          title="No order selected"
          description="Place an order or paste your order reference above to start tracking."
        />
      )}

      {activeId && orderQuery.isLoading && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
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
        <div className="space-y-4">
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

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-primary" />
                Order Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                currentStatus={order.status as OrderStatus}
                cancellationReason={cancellationReason}
              />
              {!isOrderClosed(order.status as OrderStatus) && (
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Estimated delivery in{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {order.estimatedDeliveryMinutes} minutes
                  </strong>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  )
}
