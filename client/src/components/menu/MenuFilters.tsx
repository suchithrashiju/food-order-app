interface MenuFiltersProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export function MenuFilters({
  categories,
  selectedCategory,
  onSelectCategory,
}: MenuFiltersProps) {
  const options = ['All', ...categories]

  return (
    <div className="menu-filters" role="tablist" aria-label="Menu categories">
      {options.map((category) => {
        const isActive = category === selectedCategory

        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`menu-filters__chip${isActive ? ' is-active' : ''}`}
            onClick={() => onSelectCategory(category)}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
