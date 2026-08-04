import { MenuCard } from '@/components/menu/MenuCard'
import type { MenuItem } from '@/types/menu'

interface MenuGridProps {
  items: MenuItem[]
}

export function MenuGrid({ items }: MenuGridProps) {
  return (
    <div className="menu-grid">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="menu-grid__item"
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        >
          <MenuCard item={item} />
        </div>
      ))}
    </div>
  )
}
