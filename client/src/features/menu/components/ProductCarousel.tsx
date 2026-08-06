import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { MenuCarouselCard } from '@/features/menu/components/MenuCarouselCard'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/types'

interface ProductCarouselProps {
  title: string
  subtitle?: string
  items: MenuItem[]
  seeAllTo?: string
  className?: string
  leading?: ReactNode
}

export function ProductCarousel({
  title,
  subtitle,
  items,
  seeAllTo = '/menu',
  className,
  leading,
}: ProductCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const maxScroll = el.scrollWidth - el.clientWidth
    setCanPrev(el.scrollLeft > 8)
    setCanNext(el.scrollLeft < maxScroll - 8)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return

    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)

    return () => {
      el.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [items, updateArrows])

  const scrollByCards = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.min(el.clientWidth * 0.85, 560)
    el.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  if (items.length === 0) return null

  return (
    <section className={cn('space-y-4', className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-start gap-3">
          {leading}
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to={seeAllTo}
            className="hidden text-sm font-semibold text-primary hover:underline sm:inline"
          >
            See all
          </Link>
          <button
            type="button"
            aria-label={`Previous ${title}`}
            disabled={!canPrev}
            onClick={() => scrollByCards(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Next ${title}`}
            disabled={!canNext}
            onClick={() => scrollByCards(1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.id} className="snap-start">
            <MenuCarouselCard item={item} />
          </div>
        ))}
      </div>
    </section>
  )
}
