import type {
  AuthSession,
  BookingConfirmation,
  LoginInitiated,
  Movie,
  MovieTheatreMapping,
} from '../types';

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

interface MoviesResponse {
  movies: Movie[];
}

interface TheatresResponse {
  theatres: MovieTheatreMapping['theatres'];
}

/** Send typed JSON to the backend and surface bounded errors. */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: unknown; message?: unknown } | null;
    const message = typeof payload?.message === 'string'
      ? payload.message
      : typeof payload?.error === 'string'
        ? payload.error
        : `Request failed (${response.status})`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/** Start the OTP journey. */
export const login = (mobileNumber: string): Promise<LoginInitiated> =>
  request<LoginInitiated>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber }),
  });

/** Verify OTP and retrieve the backend-issued session. */
export const verify = (mobileNumber: string, otp: string): Promise<AuthSession> =>
  request<AuthSession>('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ mobileNumber, otp }),
  });

/** Retrieve movies from the API-owned catalogue wrapper. */
export const getMovies = async (scenario?: string): Promise<Movie[]> => {
  const response = await request<MoviesResponse>(`/api/movies${scenario ? `?scenario=${encodeURIComponent(scenario)}` : ''}`);
  return response.movies;
};

/** Retrieve the selected movie and the theatres it is actually offered in. */
export const getTheatresForMovie = (movieId: number): Promise<MovieTheatreMapping> =>
  request<MovieTheatreMapping>(`/api/movies/${movieId}/theatres`);

/** Persist the fixed booking payload after client-side processing completes. */
export const createBooking = (
  input: {
    movieId: number;
    theatreId: number;
    seats: string[];
    paymentMethod: 'CARD' | 'UPI';
    totalPrice: 450;
  },
  token: string,
): Promise<BookingConfirmation> =>
  request<BookingConfirmation>('/api/bookings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });

/** Retrieve a persisted confirmation owned by the authenticated user. */
export const getBookingConfirmation = (confirmationId: string, token: string): Promise<BookingConfirmation> =>
  request<BookingConfirmation>(`/api/bookings/${encodeURIComponent(confirmationId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

/** Retrieve the full theatre catalogue when a screen needs it. */
export const getTheatres = async (): Promise<MovieTheatreMapping['theatres']> => {
  const response = await request<TheatresResponse>('/api/theatres');
  return response.theatres;
};
