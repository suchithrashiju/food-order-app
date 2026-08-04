import { CheckCircle2, Mail } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { orderService } from '@/services/order.service'
import type { EmailNotification } from '@/types'

interface SuccessLocationState {
  orderReference?: string
  emailNotification?: EmailNotification
}

export function OrderSuccessPage() {
  const { orderId = '' } = useParams()
  const location = useLocation()
  const locationState = (location.state as SuccessLocationState | null) ?? null

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getOrderById(orderId),
    enabled: Boolean(orderId),
  })

  const orderReference =
    orderQuery.data?.orderReference || locationState?.orderReference || '—'
  const emailNotification =
    orderQuery.data?.emailNotification || locationState?.emailNotification
  const trackTarget = orderQuery.data?.orderReference || orderReference

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900/60">
      <CheckCircle2 className="mb-4 h-14 w-14 text-accent" aria-hidden="true" />

      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
        Thank you for ordering!
      </h1>

      <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Your order has been placed successfully and is now being prepared.
      </p>

      <div className="mt-6 w-full max-w-md rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 dark:border-slate-700 dark:bg-slate-950">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Your order reference number
        </p>
        <p className="mt-2 font-mono text-xl font-bold tracking-wide text-primary sm:text-2xl">
          {orderReference}
        </p>
      </div>

      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        Estimated delivery:{' '}
        <strong>{orderQuery.data?.estimatedDeliveryMinutes ?? 35} minutes</strong>
      </p>

      {emailNotification ? (
        <p className="mt-4 inline-flex max-w-md items-start gap-2 rounded-xl bg-accent/10 px-3 py-2 text-left text-sm text-accent">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{emailNotification.message}</span>
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
