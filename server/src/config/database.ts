import mongoose from 'mongoose';

import { env } from '@src/config/env';

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    console.log('MongoDB is already connected.');
    return;
  }

  try {
    mongoose.set('strictQuery', true);

    console.log('Connecting to MongoDB...');

    await mongoose.connect(`${env.mongoUri}${env.database}`);

    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('Failed to connect to MongoDB.');
    console.error(error);

    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();

  console.log('MongoDB disconnected.');
}