import { clearAdminToken, setAdminToken } from '@/lib/admin-auth'
import { apiClient } from '@/lib/api-client'
import type {
  AdminDashboardStats,
  AdminMenuItem,
  AdminMenuItemPayload,
  Order,
} from '@/types'

interface LoginResponse {
  success: boolean
  data: {
    token: string
    admin: { username: string; role: 'admin' }
    expiresAt: string
  }
}

export const adminService = {
  async login(username: string, password: string): Promise<string> {
    const response = await apiClient.post<LoginResponse>('/api/admin/login', {
      username,
      password,
    })
    const token = response.data.data.token
    setAdminToken(token)
    return token
  },

  logout(): void {
    clearAdminToken()
  },

  async getDashboardStats(): Promise<AdminDashboardStats> {
    const response = await apiClient.get<{ success: boolean; data: AdminDashboardStats }>(
      '/api/admin/orders/stats',
    )
    return response.data.data
  },

  async listOrders(): Promise<Order[]> {
    const response = await apiClient.get<{ success: boolean; data: Order[] }>('/api/admin/orders')
    return response.data.data
  },

  async listMenuItems(category?: string): Promise<AdminMenuItem[]> {
    const response = await apiClient.get<{ success: boolean; data: AdminMenuItem[] }>(
      '/api/admin/menu-items',
      { params: category ? { category } : undefined },
    )
    return response.data.data
  },

  async createMenuItem(payload: AdminMenuItemPayload): Promise<AdminMenuItem> {
    const response = await apiClient.post<{ success: boolean; data: AdminMenuItem }>(
      '/api/admin/menu-items',
      payload,
    )
    return response.data.data
  },

  async updateMenuItem(
    id: string,
    payload: Partial<AdminMenuItemPayload>,
  ): Promise<AdminMenuItem> {
    const response = await apiClient.patch<{ success: boolean; data: AdminMenuItem }>(
      `/api/admin/menu-items/${id}`,
      payload,
    )
    return response.data.data
  },

  async deleteMenuItem(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/menu-items/${id}`)
  },

  async changeMenuItemStatus(id: string, isAvailable: boolean): Promise<AdminMenuItem> {
    const response = await apiClient.patch<{ success: boolean; data: AdminMenuItem }>(
      `/api/admin/menu-items/${id}/status`,
      { isAvailable },
    )
    return response.data.data
  },
}
