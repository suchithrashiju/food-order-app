import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { getOrderSocket, type OrderStatusEvent } from '@/lib/socket'
import { isOrderClosed, type OrderStatus } from '@/utils/order-status'

/**
 * Joins the Socket.IO room for an open order and invalidates the order query
 * when the server emits `order:status` (admin update or status simulator).
 */
export function useOrderStatusSocket(orderId: string | undefined, status?: OrderStatus) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!orderId || (status && isOrderClosed(status))) {
      return
    }

    const socket = getOrderSocket()

    const onStatus = (payload: OrderStatusEvent) => {
      const matches =
        payload.orderId === orderId ||
        (payload.orderReference != null && payload.orderReference === orderId)
      if (!matches) {
        return
      }
      void queryClient.invalidateQueries({ queryKey: ['order', orderId] })
    }

    const joinRoom = () => {
      socket.emit('join-order-room', orderId)
    }

    socket.on('order:status', onStatus)
    if (socket.connected) {
      joinRoom()
    }
    socket.on('connect', joinRoom)

    return () => {
      socket.off('order:status', onStatus)
      socket.off('connect', joinRoom)
    }
  }, [orderId, status, queryClient])
}
