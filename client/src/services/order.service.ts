import { apiClient } from '@/lib/api-client'
import type { CreateOrderPayload, Order, OrderResponse } from '@/types'

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const response = await apiClient.post<OrderResponse>('/api/orders', payload)
    return response.data.data
  },

  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<OrderResponse>(`/api/orders/${id}`)
    return response.data.data
  },
}
