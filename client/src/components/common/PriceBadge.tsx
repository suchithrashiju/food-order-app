import { cn, formatCurrency } from '@/lib/utils'

interface PriceBadgeProps {
  price: number
  className?: string
}

export function PriceBadge({ price, className }: PriceBadgeProps) {
  return <span className={cn('font-bold text-primary', className)}>{formatCurrency(price)}</span>
}
