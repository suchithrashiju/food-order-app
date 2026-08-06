import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Bike, Leaf, MapPinned, Star } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { CategoryCarousel } from '@/features/menu/components/CategoryCarousel'
import { ProductCarousel } from '@/features/menu/components/ProductCarousel'
import { categoryIcon } from '@/features/menu/utils/category-icons'
import { categorySectionId, groupMenuByCategory } from '@/features/menu/utils/group-menu-by-category'
import { getErrorMessage } from '@/lib/api-client'
import { menuService } from '@/services/menu.service'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80'

export function HomePage() {
  const menuQuery = useQuery({
    queryKey: ['menu'],
    queryFn: () => menuService.getMenuItems(),
  })

  const items = useMemo(
    () => (menuQuery.data ?? []).filter((item) => item.category.toLowerCase() !== 'test category'),
    [menuQuery.data],
  )

  const categories = useMemo(() => groupMenuByCategory(items), [items])

  const popularItems = useMemo(
    () => [...items].sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name)).slice(0, 10),
    [items],
  )

  const quickItems = useMemo(
    () =>
      [...items]
        .sort((a, b) => a.preparationTime - b.preparationTime || b.rating - a.rating)
        .slice(0, 8),
    [items],
  )

  return (
    <div className="space-y-12">
      <section className="relative isolate overflow-hidden rounded-3xl">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/35" />
        <div className="relative z-10 flex min-h-[340px] flex-col justify-end gap-6 px-6 py-10 sm:min-h-[400px] sm:px-10 sm:py-12">
          <div className="max-w-xl space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">
              Fresh · Fast · Delivered
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              FoodOrder
            </h1>
            <p className="max-w-md text-base text-slate-200 sm:text-lg">
              Fresh meals from our kitchen to your door — browse bestsellers and order in minutes.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button asChild size="lg">
                <Link to="/menu">
                  Order now
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Link to="/track">Track order</Link>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-slate-200">
            <span className="inline-flex items-center gap-2">
              <Bike className="h-4 w-4 text-primary" aria-hidden="true" />
              Fast delivery
            </span>
            <span className="inline-flex items-center gap-2">
              <Leaf className="h-4 w-4 text-accent" aria-hidden="true" />
              Fresh ingredients
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-sky-300" aria-hidden="true" />
              Live tracking
            </span>
          </div>
        </div>
      </section>

      {menuQuery.isLoading ? <LoadingSkeleton count={6} /> : null}

      {menuQuery.isError ? (
        <EmptyState
          title="Could not load the menu"
          description={getErrorMessage(menuQuery.error)}
          actionLabel="Try again"
          onAction={() => void menuQuery.refetch()}
        />
      ) : null}

      {!menuQuery.isLoading && !menuQuery.isError ? (
        <>
          <CategoryCarousel categories={categories} />

          <ProductCarousel
            title="Popular right now"
            subtitle="Top-rated dishes customers love"
            items={popularItems}
            leading={
              <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
            }
          />

          <ProductCarousel
            title="Ready in a flash"
            subtitle="Quick prep picks for busy days"
            items={quickItems}
            leading={
              <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <Bike className="h-4 w-4" aria-hidden="true" />
              </span>
            }
          />

          <div className="space-y-10">
            {categories.map((group) => {
              const Icon = categoryIcon(group.category)
              return (
                <div key={group.category} id={categorySectionId(group.category)} className="scroll-mt-28">
                  <ProductCarousel
                    title={group.category}
                    subtitle={`${group.items.length} delicious options`}
                    items={group.items}
                    leading={
                      <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    }
                  />
                </div>
              )
            })}
          </div>

          {items.length === 0 ? (
            <EmptyState
              title="Menu is empty"
              description="Check back soon — new dishes are on the way."
            />
          ) : (
            <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-orange-600 px-6 py-10 text-white sm:px-10">
              <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight">Hungry for more?</h2>
                  <p className="max-w-md text-sm text-orange-50/90">
                    Search the full menu, sort by price or rating, and build your perfect order.
                  </p>
                </div>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/40 bg-white text-primary hover:bg-orange-50"
                >
                  <Link to="/menu">
                    Explore full menu
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  )
}
