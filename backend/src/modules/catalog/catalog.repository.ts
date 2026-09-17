import type Database from 'better-sqlite3';

/** Represent a catalog movie persisted in SQLite. */
export interface CatalogMovie {
  id: number;
  title: string;
}

/** Represent a theatre offered for one or more movies. */
export interface CatalogTheatre {
  id: number;
  name: string;
}

/** Read and normalize the seeded catalog data. */
export class CatalogRepository {
  /** Create a repository over the application's SQLite database. */
  constructor(private readonly db: Database.Database) {}

  /** Ensure the prescribed catalogue labels remain stable across repeated initialization. */
  normalizeSeedNames(): void {
    const renameTheatre = this.db.prepare('UPDATE theatres SET name = ? WHERE id = ?');
    renameTheatre.run('Sandhya', 1);
    renameTheatre.run('Sudharsham', 2);
    renameTheatre.run('Allu', 3);
  }

  /** Return all movies in stable identifier order. */
  listMovies(): CatalogMovie[] {
    return this.db.prepare('SELECT id, title FROM movies ORDER BY id').all() as CatalogMovie[];
  }

  /** Return all theatres in stable identifier order. */
  listTheatres(): CatalogTheatre[] {
    return this.db.prepare('SELECT id, name FROM theatres ORDER BY id').all() as CatalogTheatre[];
  }

  /** Return only the theatres mapped to the specified movie. */
  listTheatresForMovie(movieId: number): CatalogTheatre[] {
    return this.db.prepare(
      `SELECT theatres.id, theatres.name
       FROM movie_theatres
       INNER JOIN theatres ON theatres.id = movie_theatres.theatre_id
       WHERE movie_theatres.movie_id = ?
       ORDER BY theatres.id`,
    ).all(movieId) as CatalogTheatre[];
  }

  /** Report whether a movie exists before mapping lookup. */
  hasMovie(movieId: number): boolean {
    return Boolean(this.db.prepare('SELECT 1 FROM movies WHERE id = ?').get(movieId));
  }
}
