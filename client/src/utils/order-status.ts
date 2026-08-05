export const ORDER_PROGRESS_STATUSES = [
  'Order Received',
  'Preparing',
  'Out for Delivery',
  'Delivered',
] as const

export const ORDER_STATUSES = [...ORDER_PROGRESS_STATUSES, 'Cancelled'] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]
export type OrderProgressStatus = (typeof ORDER_PROGRESS_STATUSES)[number]

export function isOrderClosed(status: OrderStatus): boolean {
  return status === 'Delivered' || status === 'Cancelled'
}
