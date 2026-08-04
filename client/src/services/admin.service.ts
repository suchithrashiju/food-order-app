import { apiClient } from '@/lib/api-client'
import type { AdminDashboardStats, MenuItem, Order } from '@/types'

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
    localStorage.setItem('foodorder_admin_token', token)
    return token
  },

  logout(): void {
    localStorage.removeItem('foodorder_admin_token')
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

  async listMenuItems(): Promise<MenuItem[]> {
    const response = await apiClient.get<{ success: boolean; data: MenuItem[] }>(
      '/api/admin/menu-items',
    )
    return response.data.data
  },
}
