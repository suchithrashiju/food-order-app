import { memo, useState } from 'react'
import { Clock, Plus, Star } from 'lucide-react'
import { toast } from 'sonner'

import { formatCurrency } from '@/lib/utils'
import { useCart } from '@/features/cart/context/cart-context'
import type { MenuItem } from '@/types'

interface MenuCarouselCardProps {
  item: MenuItem
}

export const MenuCarouselCard = memo(function MenuCarouselCard({ item }: MenuCarouselCardProps) {
  const { addItem } = useCart()
  const unavailable = !item.isAvailable
  const [imgError, setImgError] = useState(false)

  return (
    <article className="group flex w-[240px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md sm:w-[260px] dark:border-slate-800 dark:bg-slate-900">
      <div className="relative aspect-[5/4] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {item.imageUrl && !imgError ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            <span className="text-xs font-medium">No image</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-3 pt-10">
          <p className="text-sm font-semibold text-white drop-shadow">{formatCurrency(item.price)}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5">
        <div className="space-y-1">
          <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-white">{item.name}</h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {item.description}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
              {item.rating.toFixed(1)}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {item.preparationTime}m
            </span>
          </div>

          <button
            type="button"
            disabled={unavailable}
            onClick={() => {
              addItem(item)
              toast.success(`${item.name} added to cart`)
            }}
            aria-label={`Add ${item.name} to cart`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
})
