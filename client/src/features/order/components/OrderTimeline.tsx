import { ORDER_STATUSES, type OrderStatus } from '@/utils/order-status'
import { cn } from '@/lib/utils'

interface OrderTimelineProps {
  currentStatus: OrderStatus
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
  const currentIndex = ORDER_STATUSES.indexOf(currentStatus)

  return (
    <ol className="space-y-4" aria-label="Order status timeline">
      {ORDER_STATUSES.map((status, index) => {
        const complete = index <= currentIndex
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
