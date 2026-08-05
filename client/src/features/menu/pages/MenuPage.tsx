import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

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

export function MenuPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<SortOption>('name-asc')
  const [maxPrice, setMaxPrice] = useState('')

  const menuQuery = useQuery({
    queryKey: ['menu'],
    queryFn: () => menuService.getMenuItems(),
  })

  const categories = useMemo(() => {
    const values = new Set((menuQuery.data ?? []).map((item) => item.category))
    return ['All', ...[...values].sort((a, b) => a.localeCompare(b))]
  }, [menuQuery.data])

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

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
        <SearchBar value={search} onChange={setSearch} />
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          Sort
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="name-asc">Name A–Z</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating-desc">Top Rated</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-600 dark:text-slate-300">
          Max price
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

      {filteredItems.length === 0 ? (
        <EmptyState
          title="No dishes match your filters"
          description="Try clearing search or raising the max price."
          actionLabel="Reset filters"
          onAction={() => {
            setSearch('')
            setCategory('All')
            setMaxPrice('')
            setSort('name-asc')
          }}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => void menuQuery.refetch()}>
          Refresh menu
        </Button>
      </div>
    </section>
  )
}
