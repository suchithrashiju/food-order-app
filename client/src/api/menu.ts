import { apiGet } from '@/api/http'
import type { MenuApiResponse, MenuItem } from '@/types/menu'

function isMenuItem(value: unknown): value is MenuItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Partial<MenuItem>

  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.description === 'string' &&
    typeof item.price === 'number' &&
    typeof item.category === 'string' &&
    typeof item.isAvailable === 'boolean'
  )
}

export function mapMenuResponse(payload: unknown): MenuItem[] {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Menu response was empty or invalid')
  }

  const response = payload as Partial<MenuApiResponse>
  const source = Array.isArray(response.data)
    ? response.data
    : Array.isArray(response.items)
      ? response.items
      : null

  if (!source) {
    throw new Error('Menu response did not include an items list')
  }

  const items = source.filter(isMenuItem)

  if (items.length !== source.length) {
    throw new Error('Menu response contained invalid menu items')
  }

  return items
}

export async function getMenuItems(category?: string): Promise<MenuItem[]> {
  const params = new URLSearchParams()

  if (category && category.trim() !== '') {
    params.set('category', category.trim())
  }

  const query = params.toString()
  const path = query ? `/api/menu?${query}` : '/api/menu'
  const payload = await apiGet<unknown>(path)

  return mapMenuResponse(payload)
}
