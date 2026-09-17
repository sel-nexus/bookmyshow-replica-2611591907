import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { getBookingConfirmation } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { BookingConfirmation } from '../types';

/** Fetch and render the durable backend-owned booking confirmation. */
export default function ConfirmationPage() {
  const { confirmationId } = useParams();
  const { session } = useAuth();
  const [searchParams] = useSearchParams();
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!confirmationId || !session) return;
    void getBookingConfirmation(confirmationId, session.token)
      .then(setConfirmation)
      .catch(() => setError('Booking confirmation is unavailable.'));
  }, [confirmationId, session, searchParams]);

  if (!session) return <Navigate to="/login" replace />;
  if (error) return <main className="panel"><p role="alert">{error}</p></main>;
  if (!confirmation) return <main className="panel"><p role="status">Loading confirmation…</p></main>;
  return (
    <main className="panel">
      <p className="eyebrow">BOOKING CONFIRMED / {confirmation.confirmationId}</p>
      <h1>Congratulations!</h1>
      <p>{confirmation.movie.title} at {confirmation.theatre.name}</p>
      <p>Seats: {confirmation.seats.join(', ')}</p>
      <Link to={`/confirmation/${confirmation.confirmationId}?refresh=${Date.now()}`}>Refresh saved confirmation</Link>
    </main>
  );
}