import { MenuFilters } from '@/components/menu/MenuFilters'
import { MenuGrid } from '@/components/menu/MenuGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner } from '@/components/ui/Spinner'
import { useMenu } from '@/hooks/useMenu'

export function MenuPage() {
  const {
    items,
    categories,
    selectedCategory,
    setSelectedCategory,
    loading,
    error,
    refetch,
  } = useMenu()

  return (
    <section className="menu-page">
      <div className="menu-page__intro">
        <h1>Tonight's menu</h1>
        <p>Browse fresh plates from nearby kitchens and pick what you're craving.</p>
      </div>

      <MenuFilters
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {loading && <Spinner label="Loading menu…" />}

      {!loading && error && <ErrorState message={error} onRetry={() => void refetch()} />}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No dishes in this category"
          description="Try another category or check back soon for new specials."
        />
      )}

      {!loading && !error && items.length > 0 && <MenuGrid items={items} />}
    </section>
  )
}
