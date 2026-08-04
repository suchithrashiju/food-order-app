import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  corsOrigin: string;
}

function getEnvValue(key: string, fallback?: string): string {
  const value = process.env[key];

  if (value && value.trim() !== '') {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${key}`);
}

function getNumericEnvValue(key: string, fallback: number): number {
  const value = getEnvValue(key, String(fallback));
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }

  return parsed;
}

export const env: EnvConfig = {
  nodeEnv: getEnvValue('NODE_ENV', 'development'),
  port: getNumericEnvValue('PORT', 3000),
  mongoUri: getEnvValue('MONGO_URI', 'mongodb://127.0.0.1:27017/food-order-app'),
  corsOrigin: getEnvValue('CORS_ORIGIN', 'http://localhost:5173'),
};

export const isDevelopment = env.nodeEnv !== 'production';
