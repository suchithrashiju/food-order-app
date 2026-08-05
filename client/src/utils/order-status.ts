export const ORDER_STATUSES = [
  'Order Received',
  'Preparing',
  'Out for Delivery',
  'Delivered',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
