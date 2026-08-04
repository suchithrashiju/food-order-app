import http from 'http';
import net from 'net';

import app from '@src/app';
import { connectDatabase, disconnectDatabase } from '@src/config/database';
import { env } from '@src/config/env';
import { createSocketServer } from '@src/config/socket';

function getAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  return new Promise((resolve, reject) => {
    const tryPort = (attempt: number): void => {
      if (attempt >= maxAttempts) {
        reject(new Error(`Unable to find a free port from ${startPort} to ${startPort + maxAttempts - 1}`));
        return;
      }

      const candidatePort = startPort + attempt;
      const tester = net.createServer();

      tester.once('error', (error: NodeJS.ErrnoException) => {
        tester.close();

        if (error.code === 'EADDRINUSE') {
          console.warn(`Port ${candidatePort} is already in use. Trying ${candidatePort + 1}...`);
          tryPort(attempt + 1);
          return;
        }

        reject(error);
      });

      tester.once('listening', () => {
        const address = tester.address();
        const actualPort = typeof address === 'object' && address ? address.port : candidatePort;

        tester.close(() => resolve(actualPort));
      });

      tester.listen(candidatePort);
    };

    tryPort(0);
  });
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const { adminService } = await import('@src/modules/admin-modules/admin/admin.service');

    try {
      const seedResult = await adminService.seedAdminSetup();
      console.log('Bootstrap seed completed:', seedResult.data);
    } catch (seedError) {
      console.warn('Bootstrap seed skipped or failed:', seedError);
    }

    const server = http.createServer(app);
    const io = createSocketServer(server);
    const port = await getAvailablePort(env.port);

    app.locals.io = io;

    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Unable to bind to port ${port}. Please stop the other process or change PORT.`);
        process.exit(1);
      }

      console.error('Server error:', error);
      process.exit(1);
    });

    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
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
