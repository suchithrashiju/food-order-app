import http from 'http';

import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { createSocketServer } from './config/socket.js';

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const server = http.createServer(app);
    const io = createSocketServer(server);

    app.locals.io = io;

    server.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
    });

    const shutdown = async (): Promise<void> => {
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

void startServer();
