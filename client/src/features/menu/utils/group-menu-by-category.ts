import type { MenuItem } from '@/types'

export interface MenuCategoryGroup {
  category: string
  items: MenuItem[]
}

/** Stable DOM id for a category section (scroll targets / a11y). */
export function categorySectionId(category: string): string {
  return `category-${category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`
}

/** Group menu items by category; categories sorted A–Z, items keep caller order. */
export function groupMenuByCategory(items: MenuItem[]): MenuCategoryGroup[] {
  const map = new Map<string, MenuItem[]>()

  for (const item of items) {
    const key = item.category.trim() || 'Other'
    const bucket = map.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      map.set(key, [item])
    }
  }

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, groupItems]) => ({ category, items: groupItems }))
}
