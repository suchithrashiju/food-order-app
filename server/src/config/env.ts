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
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
  seedSecret?: string;
  smtpHost?: string;
  smtpPort: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
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

function getOptionalEnvValue(key: string): string | undefined {
  const value = process.env[key];

  if (value && value.trim() !== '') {
    return value.trim();
  }

  return undefined;
}

function getNumericEnvValue(key: string, fallback: number): number {
  const value = getEnvValue(key, String(fallback));
  const parsed = parseInt(value, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable "${key}" must be a valid number.`);
  }

  return parsed;
}

const seedSecret = getOptionalEnvValue('SEED_SECRET');
const smtpHost = getOptionalEnvValue('SMTP_HOST');
const smtpUser = getOptionalEnvValue('SMTP_USER');
const smtpPass = getOptionalEnvValue('SMTP_PASS');
const smtpFrom = getOptionalEnvValue('SMTP_FROM');

export const env: EnvConfig = {
  nodeEnv: getEnvValue('NODE_ENV', 'development'),
  port: getNumericEnvValue('PORT', 3000),
  mongoUri: getEnvValue('MONGO_URI'),
  database: getEnvValue('DATABASE'),
  corsOrigin: getEnvValue('CORS_ORIGIN', 'http://localhost:5173'),
  adminJwtSecret: getEnvValue('ADMIN_JWT_SECRET', 'change-this-admin-jwt-secret'),
  adminJwtExpiresInSeconds: getNumericEnvValue('ADMIN_JWT_EXPIRES_IN_SECONDS', 28800),
  adminUsername: getEnvValue('ADMIN_USERNAME', 'admin'),
  adminEmail: getEnvValue('ADMIN_EMAIL', 'admin@foodorder.local'),
  adminPassword: getEnvValue('ADMIN_PASSWORD', 'admin@2026'),
  smtpPort: getNumericEnvValue('SMTP_PORT', 587),
  ...(seedSecret ? { seedSecret } : {}),
  ...(smtpHost ? { smtpHost } : {}),
  ...(smtpUser ? { smtpUser } : {}),
  ...(smtpPass ? { smtpPass } : {}),
  ...(smtpFrom ? { smtpFrom } : {}),
};

export const isDevelopment = env.nodeEnv === 'development';
export const isProduction = env.nodeEnv === 'production';
