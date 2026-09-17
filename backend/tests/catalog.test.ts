import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { createTestApp, disposeTestApp } from './test-app';

const apps: ReturnType<typeof createTestApp>[] = [];

function makeApp(): ReturnType<typeof createTestApp> {
  const testApp = createTestApp();
  apps.push(testApp);
  return testApp;
}

afterEach(() => {
  while (apps.length > 0) {
    const { db, filename } = apps.pop()!;
    disposeTestApp(db, filename);
  }
});

describe('catalog API', () => {
  it('returns documented wrappers and full immutable seeded theatre labels', async () => {
    const { app, db } = makeApp();
    const movies = await request(app).get('/api/movies');
    const theatres = await request(app).get('/api/theatres');

    expect(movies.status).toBe(200);
    expect(theatres.status).toBe(200);
    expect(movies.body).toEqual({ movies: [
      { id: 1, title: 'Paradise' }, { id: 2, title: 'Bloody Romeo' }, { id: 3, title: 'OG2' },
    ] });
    expect(theatres.body).toEqual({ theatres: [
      { id: 1, name: 'Sandhya 70mm' }, { id: 2, name: 'Sudharsham 70mm' }, { id: 3, name: 'Allu Cinemas' },
    ] });
    expect(db.prepare('SELECT id, name FROM theatres ORDER BY id').all()).toEqual(theatres.body.theatres);
  });

  it('reads a movie mapping before booking and returns the documented mapping wrapper', async () => {
    const { app } = makeApp();
    const response = await request(app).get('/api/movies/1/theatres');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      movie: { id: 1, title: 'Paradise' },
      theatres: [{ id: 1, name: 'Sandhya 70mm' }, { id: 3, name: 'Allu Cinemas' }],
    });
  });

  it('rejects invalid, injection-like, and unknown mapping identifiers', async () => {
    const { app } = makeApp();
    expect((await request(app).get('/api/movies/999/theatres')).status).toBe(404);
    expect((await request(app).get('/api/movies/not-a-number/theatres')).status).toBe(400);
    expect((await request(app).get('/api/movies/1%20OR%201=1/theatres')).status).toBe(400);
  });
});
