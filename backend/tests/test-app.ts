import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type Database from 'better-sqlite3';
import { createApp } from '../src/app';
import { openDatabase } from '../src/db/database';

const config = {
  port: 0,
  sqlitePath: ':memory:',
  jwtSecret: 'test-secret',
  jwtExpiresIn: '30m' as const,
  corsOrigin: 'http://localhost',
};

/** Create an isolated, file-backed SQLite app for HTTP tests. */
export function createTestApp(): { app: ReturnType<typeof createApp>; db: Database.Database; filename: string } {
  const filename = path.join(os.tmpdir(), `bms-api-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
  const db = openDatabase(filename);
  return { app: createApp(db, { ...config, sqlitePath: filename }), db, filename };
}

/** Close and remove the isolated test database. */
export function disposeTestApp(db: Database.Database, filename: string): void {
  if (db.open) db.close();
  fs.rmSync(filename, { force: true });
}
