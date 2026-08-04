import dns from 'dns';

import mongoose from 'mongoose';

import { env } from '@src/config/env';

/**
 * Some ISP DNS resolvers refuse Node's SRV lookups for mongodb+srv URIs
 * (querySrv ECONNREFUSED). Prefer public resolvers when using SRV.
 */
function ensureSrvDnsResolvers(mongoUri: string): void {
  if (!mongoUri.startsWith('mongodb+srv://')) {
    return;
  }

  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
}

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState >= 1) {
    console.log('MongoDB is already connected.');
    return;
  }

  try {
    mongoose.set('strictQuery', true);
    ensureSrvDnsResolvers(env.mongoUri);

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