import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { categoryIcon } from '@/features/menu/utils/category-icons'
import {
  categorySectionId,
  type MenuCategoryGroup,
} from '@/features/menu/utils/group-menu-by-category'
import { cn } from '@/lib/utils'

interface CategoryCarouselProps {
  categories: MenuCategoryGroup[]
  seeAllTo?: string
  className?: string
}

export function CategoryCarousel({
  categories,
  seeAllTo = '/menu',
  className,
}: CategoryCarouselProps) {
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
  }, [categories, updateArrows])

  const scrollByCards = (direction: -1 | 1) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = Math.min(el.clientWidth * 0.85, 420)
    el.scrollBy({ left: direction * amount, behavior: 'smooth' })
  }

  if (categories.length === 0) return null

  return (
    <section className={cn('space-y-3', className)} aria-label="Browse categories">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          What are you craving?
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Link to={seeAllTo} className="text-sm font-semibold text-primary hover:underline">
            Full menu
          </Link>
          <button
            type="button"
            aria-label="Previous categories"
            disabled={!canPrev}
            onClick={() => scrollByCards(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next categories"
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
        className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((group) => {
          const Icon = categoryIcon(group.category)
          return (
            <a
              key={group.category}
              href={`#${categorySectionId(group.category)}`}
              className={cn(
                'flex w-[104px] shrink-0 snap-start flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3.5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900',
              )}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="line-clamp-1 text-xs font-semibold text-slate-800 dark:text-slate-100">
                {group.category}
              </span>
              <span className="text-[10px] text-slate-400">{group.items.length} items</span>
            </a>
          )
        })}
      </div>
    </section>
  )
}
