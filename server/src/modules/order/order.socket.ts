import type { Server as SocketIOServer } from 'socket.io';

import type { OrderStatus } from '@src/models/order.model';

export function emitOrderStatusUpdate(
  io: SocketIOServer | undefined,
  orderId: string,
  status: OrderStatus,
): void {
  io?.to(`order:${orderId}`).emit('order:status', {
    orderId,
    status,
    updatedAt: new Date().toISOString(),
  });
}
