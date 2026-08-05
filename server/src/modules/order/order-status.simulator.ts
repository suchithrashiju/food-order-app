import type { Server as SocketIOServer } from 'socket.io';

import type { OrderStatus } from '@src/models/order.model';
import { orderService } from '@src/modules/order/order.service';

const SIMULATED_STATUSES: OrderStatus[] = ['Preparing', 'Out for Delivery', 'Delivered'];

const pendingTimers = new Map<string, NodeJS.Timeout[]>();

function isSimulationEnabled(): boolean {
  const value = process.env.ORDER_STATUS_SIMULATION?.trim().toLowerCase();
  // Explicit opt-in keeps API tests deterministic.
  return value === 'true' || value === '1';
}

function getIntervalMs(): number {
  const parsed = Number.parseInt(process.env.ORDER_STATUS_SIMULATION_INTERVAL_MS ?? '8000', 10);
  return Number.isFinite(parsed) && parsed >= 1000 ? parsed : 8000;
}

export function cancelOrderStatusSimulation(orderId: string): void {
  const timers = pendingTimers.get(orderId);
  if (!timers) {
    return;
  }
  for (const timer of timers) {
    clearTimeout(timer);
  }
  pendingTimers.delete(orderId);
}

/**
 * Advances an order through Preparing → Out for Delivery → Delivered on a timer,
 * emitting Socket.IO events via orderService.updateOrderStatus.
 */
export function scheduleOrderStatusSimulation(orderId: string, io?: SocketIOServer): void {
  if (!isSimulationEnabled()) {
    return;
  }

  cancelOrderStatusSimulation(orderId);

  const intervalMs = getIntervalMs();
  const timers: NodeJS.Timeout[] = [];

  SIMULATED_STATUSES.forEach((status, index) => {
    const timer = setTimeout(() => {
      void orderService
        .updateOrderStatus(
          orderId,
          status,
          `Auto-updated to ${status} by status simulator`,
          'system',
          io,
        )
        .catch((error: unknown) => {
          // Order may have been cancelled/delivered manually — stop remaining steps.
          cancelOrderStatusSimulation(orderId);
          if (process.env.NODE_ENV !== 'test') {
            console.warn(`[order-status-simulator] skipped ${status} for ${orderId}:`, error);
          }
        });
    }, intervalMs * (index + 1));

    timers.push(timer);
  });

  pendingTimers.set(orderId, timers);
}
