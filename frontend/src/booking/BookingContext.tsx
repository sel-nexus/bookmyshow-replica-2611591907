import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Movie, Theatre } from '../types';

interface BookingValue {
  movie: Movie | null;
  theatre: Theatre | null;
  seats: string[];
  totalPrice: number | null;
  selectMovie: (movie: Movie) => void;
  selectTheatre: (theatre: Theatre) => void;
  applyFixedSelection: () => void;
}

const BookingContext = createContext<BookingValue | null>(null);

/** Provide the selected catalogue records to the booking workflow. */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [theatre, setTheatre] = useState<Theatre | null>(null);
  const [seats, setSeats] = useState<string[]>([]);
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const value = useMemo<BookingValue>(() => ({
    movie,
    theatre,
    seats,
    totalPrice,
    selectMovie: (selectedMovie) => {
      setMovie(selectedMovie);
      setTheatre(null);
      setSeats([]);
      setTotalPrice(null);
    },
    selectTheatre: setTheatre,
    applyFixedSelection: () => {
      setSeats(['A1', 'A2', 'A3']);
      setTotalPrice(450);
    },
  }), [movie, theatre, seats, totalPrice]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

/** Read the required booking selection context. */
export function useBooking(): BookingValue {
  const value = useContext(BookingContext);
  if (!value) {
    throw new Error('BookingProvider is required');
  }
  return value;
}
