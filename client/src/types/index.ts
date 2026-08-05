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
  | 'Cancelled'

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
  email?: string
  notes?: string
}

export interface EmailNotification {
  sent: boolean
  skipped: boolean
  message: string
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus
  remarks?: string
  updatedBy: string
  updatedAt: string
}

export interface Order {
  id: string
  orderReference: string
  items: OrderItem[]
  delivery: DeliveryDetails
  status: OrderStatus
  statusHistory?: OrderStatusHistoryEntry[]
  subtotal: number
  deliveryFee: number
  tax: number
  total: number
  estimatedDeliveryMinutes: number
  createdAt: string
  updatedAt: string
  emailNotification?: EmailNotification
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
  todaysOrders: number
  todaysRevenue: number
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  recentOrders: Order[]
}

export interface AdminMenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isAvailable: boolean
  isDeleted?: boolean
  createdBy?: string
  updatedBy?: string
  deletedBy?: string
}

export interface AdminMenuItemPayload {
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isAvailable?: boolean
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}
