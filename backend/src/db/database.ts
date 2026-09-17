import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
/** Open, migrate, and seed a persistent SQLite database. */
export function openDatabase(filename: string): Database.Database {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true });
  const db = new Database(filename);
  db.pragma('foreign_keys = ON');
  const migrationPath = path.resolve(__dirname, '..', '..', 'src', 'db', 'migrations', '001_initial.sql');
  db.exec(fs.readFileSync(migrationPath, 'utf8'));
  const insertMovie = db.prepare('INSERT OR IGNORE INTO movies (id,title) VALUES (?,?)');
  const insertTheatre = db.prepare('INSERT OR IGNORE INTO theatres (id,name) VALUES (?,?)');
  [[1,'Paradise'],[2,'Bloody Romeo'],[3,'OG2']].forEach(([id,title]) => insertMovie.run(id,title));
  [[1,'Sandhya 70mm'],[2,'Sudharsham 70mm'],[3,'Allu Cinemas']].forEach(([id,name]) => insertTheatre.run(id,name));
  const map = db.prepare('INSERT OR IGNORE INTO movie_theatres (movie_id,theatre_id) VALUES (?,?)');
  [[1,1],[1,3],[2,2],[3,3]].forEach(([movie,theatre]) => map.run(movie,theatre));
  return db;
}