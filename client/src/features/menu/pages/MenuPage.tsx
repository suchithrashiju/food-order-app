import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RotateCcw, SlidersHorizontal } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryChip } from '@/features/menu/components/CategoryChip'
import { MenuCard } from '@/features/menu/components/MenuCard'
import { SearchBar } from '@/features/menu/components/SearchBar'
import { getErrorMessage } from '@/lib/api-client'
import { menuService } from '@/services/menu.service'
import type { MenuItem } from '@/types'

type SortOption = 'name-asc' | 'price-asc' | 'price-desc' | 'rating-desc'

const DEFAULT_SORT: SortOption = 'name-asc'

export function MenuPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT)
  const [maxPrice, setMaxPrice] = useState('')

  const menuQuery = useQuery({
    queryKey: ['menu'],
    queryFn: () => menuService.getMenuItems(),
  })

  const categories = useMemo(() => {
    const values = new Set((menuQuery.data ?? []).map((item) => item.category))
    return ['All', ...[...values].sort((a, b) => a.localeCompare(b))]
  }, [menuQuery.data])

  const hasActiveFilters =
    search.trim() !== '' || category !== 'All' || maxPrice !== '' || sort !== DEFAULT_SORT

  const clearFilters = () => {
    setSearch('')
    setCategory('All')
    setMaxPrice('')
    setSort(DEFAULT_SORT)
  }

  const filteredItems = useMemo(() => {
    let items: MenuItem[] = menuQuery.data ?? []

    if (category !== 'All') {
      items = items.filter((item) => item.category === category)
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(term) ||
          item.description.toLowerCase().includes(term) ||
          item.category.toLowerCase().includes(term),
      )
    }

    const priceLimit = Number(maxPrice)
    if (maxPrice && !Number.isNaN(priceLimit)) {
      items = items.filter((item) => item.price <= priceLimit)
    }

    const sorted = [...items]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        case 'rating-desc':
          return b.rating - a.rating
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return sorted
  }, [menuQuery.data, category, search, maxPrice, sort])

  if (menuQuery.isLoading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
          <p className="mt-1 text-slate-500">Loading fresh dishes…</p>
        </header>
        <LoadingSkeleton />
      </section>
    )
  }

  if (menuQuery.isError) {
    return (
      <EmptyState
        title="Could not load the menu"
        description={getErrorMessage(menuQuery.error)}
        actionLabel="Try again"
        onAction={() => void menuQuery.refetch()}
      />
    )
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Menu</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Browse dishes, filter by category, and add favorites to your cart.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" />
            Filters
            {hasActiveFilters ? (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Active
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Clear filters
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-1.5">
            <label htmlFor="menu-search" className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Search
            </label>
            <SearchBar value={search} onChange={setSearch} />
          </div>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            Sort by
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Top Rated</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300">
            Max price (₹)
            <Input
              type="number"
              min={0}
              step="1"
              placeholder="e.g. 12"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((entry) => (
              <CategoryChip
                key={entry}
                label={entry}
                active={category === entry}
                onClick={() => setCategory(entry)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              {filteredItems.length}
            </span>{' '}
            {filteredItems.length === 1 ? 'dish' : 'dishes'}
          </p>
          <Button variant="ghost" size="sm" onClick={() => void menuQuery.refetch()}>
            Refresh menu
          </Button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <EmptyState
          title="No dishes match your filters"
          description="Try clearing search or raising the max price."
          actionLabel="Clear filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
