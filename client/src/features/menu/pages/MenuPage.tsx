import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { RefreshCw, RotateCcw, Search, SlidersHorizontal, UtensilsCrossed } from 'lucide-react'

import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryMenuSections } from '@/features/menu/components/CategoryMenuSections'
import { SearchBar } from '@/features/menu/components/SearchBar'
import { getErrorMessage } from '@/lib/api-client'
import { menuService } from '@/services/menu.service'
import type { MenuItem } from '@/types'

type SortOption = 'name-asc' | 'price-asc' | 'price-desc' | 'rating-desc'

const DEFAULT_SORT: SortOption = 'name-asc'

export function MenuPage() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>(DEFAULT_SORT)
  const [maxPrice, setMaxPrice] = useState('')

  const menuQuery = useQuery({
    queryKey: ['menu'],
    queryFn: () => menuService.getMenuItems(),
  })

  const catalog = useMemo(
    () =>
      (menuQuery.data ?? []).filter((item) => item.category.toLowerCase() !== 'test category'),
    [menuQuery.data],
  )

  const hasActiveFilters = search.trim() !== '' || maxPrice !== '' || sort !== DEFAULT_SORT

  const clearFilters = () => {
    setSearch('')
    setMaxPrice('')
    setSort(DEFAULT_SORT)
  }

  const filteredItems = useMemo(() => {
    let items: MenuItem[] = catalog

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
  }, [catalog, search, maxPrice, sort])

  if (menuQuery.isLoading) {
    return (
      <section className="space-y-6">
        <MenuHero dishCount={null} />
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
    <section className="space-y-8">
      <MenuHero dishCount={catalog.length} />

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:px-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </span>
            Find your dish
            {hasActiveFilters ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                Filters on
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void menuQuery.refetch()}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:p-6 md:grid-cols-[1.5fr_1fr_1fr]">
          <div className="space-y-1.5">
            <label
              htmlFor="menu-search"
              className="text-sm font-medium text-slate-600 dark:text-slate-300"
            >
              Search
            </label>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name, description, or category…"
            />
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
              placeholder="e.g. 15"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-sm dark:border-slate-800 dark:bg-slate-950/50 sm:px-6">
          <p className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Search className="h-4 w-4 text-primary" aria-hidden="true" />
            Showing{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {filteredItems.length}
            </span>{' '}
            of {catalog.length} {catalog.length === 1 ? 'dish' : 'dishes'}
          </p>
          {hasActiveFilters ? (
            <p className="text-xs text-slate-400">Results update as you type</p>
          ) : (
            <p className="text-xs text-slate-400">Scroll categories or jump with the chips below</p>
          )}
        </div>
      </div>

      <CategoryMenuSections
        items={filteredItems}
        emptyTitle="No dishes match your filters"
        emptyDescription="Try clearing search or raising the max price."
        actionLabel="Clear filters"
        onAction={clearFilters}
      />
    </section>
  )
}

function MenuHero({ dishCount }: { dishCount: number | null }) {
  return (
    <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 px-6 py-8 text-white sm:px-8 sm:py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
            Full menu
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Explore our dishes</h1>
          <p className="text-sm text-slate-300 sm:text-base">
            Search, sort, and browse by category — then add favorites straight to your cart.
          </p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-300">Available now</p>
            <p className="text-lg font-bold">
              {dishCount === null ? '…' : dishCount} {dishCount === 1 ? 'dish' : 'dishes'}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
