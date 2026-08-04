import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  nodeEnv: string;
  port: number;
  mongoUri: string;
  database: string;
  corsOrigin: string;
  adminJwtSecret: string;
  adminJwtExpiresInSeconds: number;
}

function getEnvValue(key: string, fallback?: string): string {
  const value = process.env[key];

  if (value && value.trim() !== '') {
    return value.trim();
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${key}`);
}

function getNumericEnvValue(key: string, fallback: number): number {
  const value = getEnvValue(key, String(fallback));
  const parsed = parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable "${key}" must be a valid number.`);
  }

  return parsed;
}

export const env: EnvConfig = {
  nodeEnv: getEnvValue('NODE_ENV', 'development'),
  port: getNumericEnvValue('PORT', 3000),
  mongoUri: getEnvValue('MONGO_URI'),
  database: getEnvValue('DATABASE'),
  corsOrigin: getEnvValue('CORS_ORIGIN', 'http://localhost:5173'),
  adminJwtSecret: getEnvValue('ADMIN_JWT_SECRET', 'change-this-admin-jwt-secret'),
  adminJwtExpiresInSeconds: getNumericEnvValue('ADMIN_JWT_EXPIRES_IN_SECONDS', 28800),
};

export const isDevelopment = env.nodeEnv === 'development';
