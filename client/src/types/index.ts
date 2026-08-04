export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isAvailable: boolean
  rating: number
  preparationTime: number
}

export interface MenuListResponse {
  success: boolean
  data: MenuItem[]
  items: MenuItem[]
  count: number
  total: number
}

export type OrderStatus =
  | 'Order Received'
  | 'Preparing'
  | 'Out for Delivery'
  | 'Delivered'

export interface OrderItem {
  menuItemId: string
  name: string
  price: number
  quantity: number
}

export interface DeliveryDetails {
  name: string
  phone: string
  address: string
  city: string
  postalCode: string
  notes?: string
}

export interface Order {
  id: string
  items: OrderItem[]
  delivery: DeliveryDetails
  status: OrderStatus
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  estimatedDeliveryMinutes: number
  createdAt: string
  updatedAt: string
}

export interface CreateOrderPayload {
  items: OrderItem[]
  delivery: DeliveryDetails
}

export interface OrderResponse {
  success: boolean
  data: Order
}

export interface AdminDashboardStats {
  totalOrders: number
  todaysRevenue: number
  pendingOrders: number
  completedOrders: number
  recentOrders: Order[]
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}
