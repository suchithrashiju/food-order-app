import { memo, useState } from 'react'
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
  const [imgError, setImgError] = useState(false)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {item.imageUrl && !imgError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 3l18 18M9.75 9.75a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <span className="text-xs font-medium opacity-50">No image</span>
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
