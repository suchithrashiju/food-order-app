import { useEffect, useMemo, useRef, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { CategoryChip } from '@/features/menu/components/CategoryChip'
import { MenuCard } from '@/features/menu/components/MenuCard'
import { categoryIcon } from '@/features/menu/utils/category-icons'
import {
  categorySectionId,
  groupMenuByCategory,
} from '@/features/menu/utils/group-menu-by-category'
import type { MenuItem } from '@/types'

interface CategoryMenuSectionsProps {
  items: MenuItem[]
  emptyTitle?: string
  emptyDescription?: string
  actionLabel?: string
  onAction?: () => void
}

export function CategoryMenuSections({
  items,
  emptyTitle = 'No dishes found',
  emptyDescription = 'Try adjusting your filters or search.',
  actionLabel,
  onAction,
}: CategoryMenuSectionsProps) {
  const groups = useMemo(() => groupMenuByCategory(items), [items])
  const [activeCategory, setActiveCategory] = useState(groups[0]?.category ?? '')
  const scrollingToRef = useRef<string | null>(null)

  useEffect(() => {
    if (groups.length === 0) {
      setActiveCategory('')
      return
    }
    if (!groups.some((group) => group.category === activeCategory)) {
      setActiveCategory(groups[0].category)
    }
  }, [groups, activeCategory])

  useEffect(() => {
    if (groups.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollingToRef.current) return

        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const top = visible[0]
        if (!top?.target.id) return

        const match = groups.find((group) => categorySectionId(group.category) === top.target.id)
        if (match) setActiveCategory(match.category)
      },
      {
        rootMargin: '-140px 0px -55% 0px',
        threshold: [0.15, 0.35, 0.6],
      },
    )

    for (const group of groups) {
      const el = document.getElementById(categorySectionId(group.category))
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [groups])

  const scrollToCategory = (category: string) => {
    const id = categorySectionId(category)
    const el = document.getElementById(id)
    if (!el) return

    setActiveCategory(category)
    scrollingToRef.current = category
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })

    window.setTimeout(() => {
      if (scrollingToRef.current === category) {
        scrollingToRef.current = null
      }
    }, 700)
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={actionLabel}
        onAction={onAction}
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="sticky top-16 z-30 -mx-1 rounded-2xl border border-slate-200/80 bg-white/95 px-3 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-4">
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Jump to category
        </p>
        <div
          className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="tablist"
          aria-label="Menu categories"
        >
          {groups.map((group) => {
            const Icon = categoryIcon(group.category)
            const active = activeCategory === group.category
            return (
              <div key={group.category} className="shrink-0">
                <CategoryChip
                  label={`${group.category} (${group.items.length})`}
                  active={active}
                  onClick={() => scrollToCategory(group.category)}
                  icon={<Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div className="space-y-12">
        {groups.map((group) => {
          const Icon = categoryIcon(group.category)
          return (
            <section
              key={group.category}
              id={categorySectionId(group.category)}
              aria-labelledby={`${categorySectionId(group.category)}-heading`}
              className="scroll-mt-40"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id={`${categorySectionId(group.category)}-heading`}
                    className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl"
                  >
                    {group.category}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.items.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
