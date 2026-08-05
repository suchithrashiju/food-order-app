import type { Server as SocketIOServer } from 'socket.io';

import type { OrderStatus } from '@src/models/order.model';

export function emitOrderStatusUpdate(
  io: SocketIOServer | undefined,
  order: { orderId: string; orderReference: string },
  status: OrderStatus,
): void {
  const payload = {
    orderId: order.orderId,
    orderReference: order.orderReference,
    status,
    updatedAt: new Date().toISOString(),
  };

  // Clients may join with Mongo id or FO-… reference — notify both rooms.
  io?.to(`order:${order.orderId}`).emit('order:status', payload);
  if (order.orderReference && order.orderReference !== order.orderId) {
    io?.to(`order:${order.orderReference}`).emit('order:status', payload);
  }
}
