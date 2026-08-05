import { ORDER_PROGRESS_STATUSES, type OrderStatus } from '@/utils/order-status'
import { cn } from '@/lib/utils'

interface OrderTimelineProps {
  currentStatus: OrderStatus
  cancellationReason?: string
}

export function OrderTimeline({ currentStatus, cancellationReason }: OrderTimelineProps) {
  if (currentStatus === 'Cancelled') {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        role="status"
      >
        <p className="font-semibold">This order has been cancelled.</p>
        {cancellationReason ? (
          <p className="mt-2 text-red-600/90 dark:text-red-300/90">
            <span className="font-medium">Reason: </span>
            {cancellationReason}
          </p>
        ) : null}
      </div>
    )
  }

  const currentIndex = ORDER_PROGRESS_STATUSES.indexOf(
    currentStatus as (typeof ORDER_PROGRESS_STATUSES)[number],
  )

  return (
    <ol className="space-y-4" aria-label="Order status timeline">
      {ORDER_PROGRESS_STATUSES.map((status, index) => {
        const complete = currentIndex >= 0 && index <= currentIndex
        const active = index === currentIndex

        return (
          <li key={status} className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                complete ? 'bg-accent text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-700',
                active && 'ring-4 ring-accent/20',
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div>
              <p className={cn('font-semibold', complete ? 'text-slate-900 dark:text-white' : 'text-slate-400')}>
                {status}
              </p>
              {active ? (
                <p className="text-sm text-accent">Current status</p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
