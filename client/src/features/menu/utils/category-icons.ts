import {
  Coffee,
  Cookie,
  Drumstick,
  Leaf,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Appetizers: Soup,
  Burgers: Drumstick,
  Desserts: Cookie,
  Drinks: Coffee,
  Pasta: UtensilsCrossed,
  Pizza: Pizza,
  Salads: Salad,
  Sandwiches: Sandwich,
  Sides: Leaf,
  Wraps: Sandwich,
}

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICONS[category] ?? UtensilsCrossed
}
