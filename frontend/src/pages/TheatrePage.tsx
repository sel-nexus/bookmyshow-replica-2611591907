import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getTheatresForMovie } from '../api/client';
import { useBooking } from '../booking/BookingContext';
import type { MovieTheatreMapping, Theatre } from '../types';

/** Display theatres offered for the selected movie and continue the booking flow. */
export default function TheatrePage() {
  const navigate = useNavigate();
  const { movie, selectTheatre } = useBooking();
  const [catalogue, setCatalogue] = useState<MovieTheatreMapping | null>(null);
  const [loading, setLoading] = useState(Boolean(movie));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!movie) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);
    void getTheatresForMovie(movie.id)
      .then((response) => {
        if (active) {
          setCatalogue(response);
        }
      })
      .catch(() => {
        if (active) {
          setError('Unable to load theatres. Please choose another movie.');
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
  }, [movie]);

  if (!movie) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleTheatreSelection(theatre: Theatre): void {
    selectTheatre(theatre);
    navigate('/seats');
  }

  return (
    <main className="panel">
      <p className="eyebrow">THEATRES FOR {catalogue?.movie.title ?? movie.title}</p>
      <h1>Choose a theatre</h1>
      {loading && <p role="status">Loading theatres…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && catalogue?.theatres.length === 0 && (
        <p role="status">No theatres are currently available for this movie.</p>
      )}
      {!loading && !error && catalogue && catalogue.theatres.length > 0 && (
        <div className="catalogue-list" aria-label="Theatres">
          {catalogue.theatres.map((theatre) => (
            <button
              className="button"
              key={theatre.id}
              type="button"
              onClick={() => handleTheatreSelection(theatre)}
            >
              {theatre.name}
            </button>
          ))}
        </div>
      )}
    </main>
  );
}
