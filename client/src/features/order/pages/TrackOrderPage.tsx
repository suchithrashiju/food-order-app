import { useQuery } from '@tanstack/react-query'
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
      navigate(`/track/${trimmed}`)
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Track Order</h1>
        <p className="mt-1 text-slate-500">Enter your order reference number to follow live status updates.</p>
      </header>

      <Card>
        <CardContent className="p-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={onSubmit}>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="orderId">Order reference</Label>
              <Input
                id="orderId"
                value={inputId}
                onChange={(event) => setInputId(event.target.value)}
                placeholder="e.g. FO-260805-A3K9X2"
              />
            </div>
            <Button type="submit">Track</Button>
          </form>
        </CardContent>
      </Card>

      {!activeId ? (
        <EmptyState
          title="No order selected"
          description="Place an order or paste your order reference above to start tracking."
        />
      ) : null}

      {activeId && orderQuery.isLoading ? (
        <p className="text-sm text-slate-500">Refreshing order status…</p>
      ) : null}

      {activeId && orderQuery.isError ? (
        <EmptyState
          title="Order not found"
          description={getErrorMessage(orderQuery.error)}
          actionLabel="Try again"
          onAction={() => void orderQuery.refetch()}
        />
      ) : null}

      {orderQuery.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Status: {orderQuery.data.status}</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline currentStatus={orderQuery.data.status as OrderStatus} />
          </CardContent>
        </Card>
      ) : null}
    </section>
  )
}
