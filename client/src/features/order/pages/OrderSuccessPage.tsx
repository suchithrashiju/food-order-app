import { CheckCircle2, Clock, Mail, Package, Receipt } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { orderService } from '@/services/order.service'
import type { EmailNotification, Order } from '@/types'

interface SuccessLocationState {
  order?: Order
  orderReference?: string
  emailNotification?: EmailNotification
}

function fmt(amount: number) {
  return `₹${amount.toFixed(2)}`
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

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="h-10 w-10 text-green-500" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Your Order is Placed! 🎉
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sit back and relax — your food is being freshly prepared.
        </p>
        <Badge variant="muted" className="mt-3">
          Pending — Order Received
        </Badge>
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <Receipt className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Order Reference
            </p>
            <p className="mt-0.5 font-mono text-lg font-bold text-primary">
              {orderReference}
            </p>
          </div>
        </div>

        {order?.items && order.items.length > 0 && (
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Items Ordered
              </p>
            </div>
            <ul className="space-y-1.5">
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
          </div>
        )}

        {order && (
          <div className="space-y-1.5 px-5 py-4 text-sm">
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
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 dark:border-slate-700 dark:text-white">
              <span>Total Paid</span>
              <span className="text-primary">{fmt(order.total)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:bg-orange-900/20 dark:text-orange-300">
        <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Estimated delivery in{' '}
          <strong>{order?.estimatedDeliveryMinutes ?? 35} minutes</strong>
        </span>
      </div>

      {emailNotification && (
        <div className="flex w-full items-start gap-2 rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{emailNotification.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link to={`/track/${encodeURIComponent(trackTarget)}`}>Track Order</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/menu">Browse Menu</Link>
        </Button>
      </div>
    </div>
  )
}
