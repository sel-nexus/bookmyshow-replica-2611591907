import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();

/** Load runtime configuration and reject incomplete production deployments. */
export function loadConfig(overrides: Partial<NodeJS.ProcessEnv> = {}) {
  const env = { ...process.env, ...overrides };
  const requiredInProduction = ['SQLITE_PATH', 'JWT_SECRET', 'CORS_ORIGIN'] as const;

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
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
    catalogTestMode: env.CATALOG_TEST_MODE === 'true',
  };
}

export type Config = ReturnType<typeof loadConfig>;