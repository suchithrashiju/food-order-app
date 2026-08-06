import { ORDER_PROGRESS_STATUSES, type OrderStatus } from '@/utils/order-status'
import { Bike, Check, ChefHat, Package, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrderTimelineProps {
  currentStatus: OrderStatus
  cancellationReason?: string
  compact?: boolean
}

const STATUS_META: Record<
  (typeof ORDER_PROGRESS_STATUSES)[number],
  { icon: typeof Package; hint: string }
> = {
  'Order Received': { icon: Package, hint: 'We’ve got your order' },
  Preparing: { icon: ChefHat, hint: 'Kitchen is cooking' },
  'Out for Delivery': { icon: Bike, hint: 'Courier is on the way' },
  Delivered: { icon: Check, hint: 'Enjoy your meal' },
}

export function OrderTimeline({
  currentStatus,
  cancellationReason,
  compact = false,
}: OrderTimelineProps) {
  if (currentStatus === 'Cancelled') {
    return (
      <div
        className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        role="status"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <XCircle className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold">This order has been cancelled.</p>
          {cancellationReason ? (
            <p className="mt-1.5 text-red-600/90 dark:text-red-300/90">
              <span className="font-medium">Reason: </span>
              {cancellationReason}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  const currentIndex = ORDER_PROGRESS_STATUSES.indexOf(
    currentStatus as (typeof ORDER_PROGRESS_STATUSES)[number],
  )

  return (
    <ol
      className={cn('relative', compact ? 'space-y-3' : 'space-y-0')}
      aria-label="Order status timeline"
    >
      {ORDER_PROGRESS_STATUSES.map((status, index) => {
        const complete = currentIndex >= 0 && index <= currentIndex
        const active = index === currentIndex
        const upcoming = index > currentIndex
        const meta = STATUS_META[status]
        const Icon = meta.icon
        const isLast = index === ORDER_PROGRESS_STATUSES.length - 1

        return (
          <li key={status} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-0.5',
                  complete && !active ? 'bg-accent' : 'bg-slate-200 dark:bg-slate-700',
                  active && 'bg-gradient-to-b from-accent to-slate-200 dark:to-slate-700',
                )}
              />
            ) : null}

            <span
              className={cn(
                'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition',
                complete && !active && 'border-accent bg-accent text-white',
                active && 'border-accent bg-accent text-white shadow-lg shadow-accent/25 ring-4 ring-accent/15',
                upcoming && 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900',
              )}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>

            <div className={cn('min-w-0 pt-1.5', compact && 'pt-2')}>
              <p
                className={cn(
                  'font-semibold',
                  complete ? 'text-slate-900 dark:text-white' : 'text-slate-400',
                )}
              >
                {status}
              </p>
              {active ? (
                <p className="mt-0.5 text-sm font-medium text-accent">Current status</p>
              ) : (
                <p className="mt-0.5 text-sm text-slate-400">{meta.hint}</p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
