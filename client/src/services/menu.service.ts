import { apiClient } from '@/lib/api-client'
import type { MenuItem, MenuListResponse } from '@/types'

export const menuService = {
  async getMenuItems(category?: string): Promise<MenuItem[]> {
    const response = await apiClient.get<MenuListResponse>('/api/menu', {
      params: category ? { category } : undefined,
    })
    return response.data.data ?? response.data.items ?? []
  },

  async getMenuItemById(id: string): Promise<MenuItem> {
    const response = await apiClient.get<{ success: boolean; data: MenuItem }>(`/api/menu/${id}`)
    return response.data.data
  },
}
