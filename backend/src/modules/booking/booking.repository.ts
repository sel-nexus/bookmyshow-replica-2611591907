import type Database from 'better-sqlite3';

export interface Confirmation {
  confirmationId: string;
  movie: { id: number; title: string };
  theatre: { id: number; name: string };
  seats: string[];
}

type ConfirmationRow = {
  id: number;
  movieId: number;
  title: string;
  theatreId: number;
  name: string;
  seats: string;
};

/** Persist and project booking records from SQLite. */
export class BookingRepository {
  constructor(private readonly db: Database.Database) {}

  /** Check whether a theatre offers the requested movie. */
  isOffered(movieId: number, theatreId: number): boolean {
    return Boolean(this.db.prepare('SELECT 1 FROM movie_theatres WHERE movie_id = ? AND theatre_id = ?').get(movieId, theatreId));
  }

  /** Save a booking and return its persisted confirmation projection. */
  create(userId: number, input: { movieId: number; theatreId: number; seats: string[]; paymentMethod: 'CARD' | 'UPI'; totalPrice: number }): Confirmation {
    return this.db.transaction(() => {
      const result = this.db.prepare('INSERT INTO bookings (user_id, movie_id, theatre_id, seats, payment_method, total_price) VALUES (?, ?, ?, ?, ?, ?)').run(userId, input.movieId, input.theatreId, JSON.stringify(input.seats), input.paymentMethod, input.totalPrice);
      return this.toConfirmation(this.findRowById(userId, Number(result.lastInsertRowid))!);
    })();
  }

  /** Find an owned booking by its public confirmation identifier. */
  findByConfirmationId(userId: number, confirmationId: string): Confirmation | null {
    const match = /^BMS-(\d+)$/.exec(confirmationId);
    if (!match) return null;

    const row = this.findRowById(userId, Number(match[1]));
    return row ? this.toConfirmation(row) : null;
  }

  /** Load an owned booking row with the immutable catalog labels used in a confirmation. */
  private findRowById(userId: number, bookingId: number): ConfirmationRow | undefined {
    return this.db.prepare('SELECT b.id, m.id AS movieId, m.title, t.id AS theatreId, t.name, b.seats FROM bookings b JOIN movies m ON m.id = b.movie_id JOIN theatres t ON t.id = b.theatre_id WHERE b.id = ? AND b.user_id = ?').get(bookingId, userId) as ConfirmationRow | undefined;
  }

  /** Convert a joined database row into the public confirmation contract. */
  private toConfirmation(row: ConfirmationRow): Confirmation {
    return {
      confirmationId: `BMS-${row.id}`,
      movie: { id: row.movieId, title: row.title },
      theatre: { id: row.theatreId, name: row.name },
      seats: JSON.parse(row.seats) as string[],
    };
  }
}