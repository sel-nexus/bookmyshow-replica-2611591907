import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMovies } from '../api/client';
import { useBooking } from '../booking/BookingContext';
import type { Movie } from '../types';

/** Display API-owned films and begin theatre selection on an explicit action. */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { selectMovie } = useBooking();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void getMovies()
      .then((catalogue) => {
        if (active) {
          setMovies(catalogue);
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load movies. Please try again.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  function handleMovieSelection(movie: Movie): void {
    selectMovie(movie);
    navigate('/theatres');
  }

  return (
    <main className="panel">
      <p className="eyebrow">DISCOVERY</p>
      <h1>Choose a film</h1>
      <p>Select a movie to see theatres offered by the live catalogue.</p>
      {loading && <p role="status">Loading movies…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && (
        <div className="catalogue-list" aria-label="Movies">
          {movies.map((movie) => (
            <button className="button" key={movie.id} type="button" onClick={() => handleMovieSelection(movie)}>
              {movie.title}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
