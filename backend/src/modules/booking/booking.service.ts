import type Database from 'better-sqlite3';
import { BookingRepository, type Confirmation } from './booking.repository';

/** Identify expected booking-rule failures for safe HTTP translation. */
export class BookingValidationError extends Error {}

/** Enforce fixed-flow booking rules before persistence. */
export class BookingService {
  constructor(private readonly db: Database.Database, private readonly repository: BookingRepository) {}

  /** Persist only a valid booking for an existing user and offered theatre. */
  create(
    userId: number,
    input: { movieId: number; theatreId: number; seats: string[]; paymentMethod: 'CARD' | 'UPI'; totalPrice: number },
  ): Confirmation {
    if (!this.db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId)) {
      throw new BookingValidationError('Invalid booking');
    }

    if (
      input.seats.join(',') !== 'A1,A2,A3'
      || input.totalPrice !== 450
      || !this.repository.isOffered(input.movieId, input.theatreId)
    ) {
      throw new BookingValidationError('Invalid booking');
    }

    return this.repository.create(userId, input);
  }

  /** Return an existing confirmation only when it belongs to the authenticated user. */
  getConfirmation(userId: number, confirmationId: string): Confirmation | null {
    return this.repository.findByConfirmationId(userId, confirmationId);
  }
}