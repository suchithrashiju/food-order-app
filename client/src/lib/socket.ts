import { io, type Socket } from 'socket.io-client'

import type { OrderStatus } from '@/types'

export interface OrderStatusEvent {
  orderId: string
  status: OrderStatus
  updatedAt?: string
}

function getSocketBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL?.trim()
  if (apiUrl) {
    return apiUrl.replace(/\/$/, '')
  }
  // Dev: Vite proxies /api only — Socket.IO talks to the API host directly.
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'
  }
  return window.location.origin
}

let sharedSocket: Socket | null = null

export function getOrderSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io(getSocketBaseUrl(), {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    })
  }
  return sharedSocket
}
