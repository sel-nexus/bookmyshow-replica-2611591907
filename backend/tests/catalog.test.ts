import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { openDatabase } from '../src/db/database';

/** Create an API backed by the embedded SQLite engine required by this application. */
function createCatalogApp() {
  return createApp(openDatabase(':memory:'), {
    port: 0,
    sqlitePath: ':memory:',
    jwtSecret: 'test-secret',
    jwtExpiresIn: '30m',
    corsOrigin: 'http://localhost',
  });
}

describe('catalog API', () => {
  it('returns the exact prescribed seeded movie and theatre names', async () => {
    const app = createCatalogApp();

    const movies = await request(app).get('/api/movies');
    const theatres = await request(app).get('/api/theatres');

    expect(movies.status).toBe(200);
    expect(movies.body).toEqual([
      { id: 1, title: 'Paradise' },
      { id: 2, title: 'Bloody Romeo' },
      { id: 3, title: 'OG2' },
    ]);
    expect(theatres.status).toBe(200);
    expect(theatres.body).toEqual([
      { id: 1, name: 'Sandhya' },
      { id: 2, name: 'Sudharsham' },
      { id: 3, name: 'Allu' },
    ]);
  });

  it('returns only backend-mapped theatres for each known movie', async () => {
    const app = createCatalogApp();

    const paradiseTheatres = await request(app).get('/api/movies/1/theatres');
    const bloodyRomeoTheatres = await request(app).get('/api/movies/2/theatres');

    expect(paradiseTheatres.status).toBe(200);
    expect(paradiseTheatres.body).toEqual([
      { id: 1, name: 'Sandhya' },
      { id: 3, name: 'Allu' },
    ]);
    expect(bloodyRomeoTheatres.body).toEqual([{ id: 2, name: 'Sudharsham' }]);
  });

  it('rejects invalid and unknown movie mappings while preserving idempotent seed rows', async () => {
    const database = openDatabase(':memory:');
    const app = createApp(database, { port: 0, sqlitePath: ':memory:', jwtSecret: 'test-secret', jwtExpiresIn: '30m', corsOrigin: 'http://localhost' });
    createApp(database, { port: 0, sqlitePath: ':memory:', jwtSecret: 'test-secret', jwtExpiresIn: '30m', corsOrigin: 'http://localhost' });

    expect(database.prepare('SELECT COUNT(*) AS count FROM movies').get()).toEqual({ count: 3 });
    expect(database.prepare('SELECT COUNT(*) AS count FROM theatres').get()).toEqual({ count: 3 });
    expect((await request(app).get('/api/movies/999/theatres')).status).toBe(404);
    expect((await request(app).get('/api/movies/not-a-number/theatres')).status).toBe(400);
  });
});
