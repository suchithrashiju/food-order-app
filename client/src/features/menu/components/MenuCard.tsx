import { memo } from 'react'
import { Clock, Star } from 'lucide-react'
import { toast } from 'sonner'

import { PriceBadge } from '@/components/common/PriceBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCart } from '@/features/cart/context/cart-context'
import type { MenuItem } from '@/types'

interface MenuCardProps {
  item: MenuItem
}

export const MenuCard = memo(function MenuCard({ item }: MenuCardProps) {
  const { addItem } = useCart()
  const unavailable = !item.isAvailable

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl font-bold text-primary/40">
            {item.name.slice(0, 1)}
          </div>
        )}
        <Badge
          variant={unavailable ? 'danger' : 'success'}
          className="absolute left-3 top-3 backdrop-blur"
        >
          {unavailable ? 'Unavailable' : 'Available'}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{item.name}</h3>
            <Badge variant="muted" className="mt-1">
              {item.category}
            </Badge>
          </div>
          <PriceBadge price={item.price} />
        </div>

        <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>

        <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {item.rating.toFixed(1)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {item.preparationTime} min
          </span>
        </div>

        <Button
          disabled={unavailable}
          onClick={() => {
            addItem(item)
            toast.success(`${item.name} added to cart`)
          }}
          aria-label={`Add ${item.name} to cart`}
        >
          Add to Cart
        </Button>
      </div>
    </article>
  )
})
