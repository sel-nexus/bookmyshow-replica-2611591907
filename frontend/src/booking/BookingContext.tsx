import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Movie, Theatre } from '../types';

interface BookingValue {
  movie: Movie | null;
  theatre: Theatre | null;
  selectMovie: (movie: Movie) => void;
  selectTheatre: (theatre: Theatre) => void;
}

const BookingContext = createContext<BookingValue | null>(null);

/** Provide the selected catalogue records to the booking workflow. */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [theatre, setTheatre] = useState<Theatre | null>(null);
  const value = useMemo<BookingValue>(() => ({
    movie,
    theatre,
    selectMovie: (selectedMovie) => {
      setMovie(selectedMovie);
      setTheatre(null);
    },
    selectTheatre: setTheatre,
  }), [movie, theatre]);

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
