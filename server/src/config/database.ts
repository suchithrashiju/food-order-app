import mongoose from 'mongoose';

import { env } from '@src/config/env';

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongoUri);
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
