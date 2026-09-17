import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

/** Load runtime configuration and reject incomplete production deployments. */
export function loadConfig(overrides: Partial<NodeJS.ProcessEnv> = {}) {
  const env = {
    API_PORT: process.env.API_PORT,
    SQLITE_PATH: process.env.SQLITE_PATH,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    NODE_ENV: process.env.NODE_ENV,
    CATALOG_TEST_MODE: process.env.CATALOG_TEST_MODE,
    ...overrides,
  };
  const requiredInProduction = ['SQLITE_PATH', 'JWT_SECRET'] as const;

  if (env.NODE_ENV === 'production') {
    const missing = requiredInProduction.filter((key) => !env[key]?.trim());
    if (missing.length > 0) {
      throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
    }
  }

  return {
    port: Number(env.API_PORT ?? 3000),
    sqlitePath: env.SQLITE_PATH ?? './data/bookmyshow.db',
    jwtSecret: env.JWT_SECRET ?? 'test-secret',
    jwtExpiresIn: (env.JWT_EXPIRES_IN ?? '30m') as NonNullable<SignOptions['expiresIn']>,
    corsOrigin: env.CORS_ORIGIN ?? (env.NODE_ENV === 'production' ? undefined : 'http://localhost:5173'),
    catalogTestMode: env.CATALOG_TEST_MODE === 'true',
  };
}

export type Config = ReturnType<typeof loadConfig>;