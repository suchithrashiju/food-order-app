import type { Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';

import { env } from '@src/config/env';

export function createSocketServer(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigin,
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    socket.on('join-order-room', (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      // No-op for now; business modules can hook in later.
    });
  });

  return io;
}
