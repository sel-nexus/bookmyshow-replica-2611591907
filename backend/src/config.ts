import dotenv from 'dotenv';
import type { SignOptions } from 'jsonwebtoken';

dotenv.config();
/** Load runtime configuration with safe local defaults. */
export function loadConfig(overrides: Partial<NodeJS.ProcessEnv> = {}) {
  const env = { ...process.env, ...overrides };
  return { port: Number(env.API_PORT ?? 3000), sqlitePath: env.SQLITE_PATH ?? './data/bookmyshow.db', jwtSecret: env.JWT_SECRET ?? 'test-secret', jwtExpiresIn: (env.JWT_EXPIRES_IN ?? '30m') as NonNullable<SignOptions['expiresIn']>, corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173' };
}
export type Config = ReturnType<typeof loadConfig>;