import { Navigate, useNavigate } from 'react-router-dom';
import { useBooking } from '../booking/BookingContext';

const allSeats = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4'];
/** Render a non-interactive theatre grid and apply prescribed seats on action. */
export default function SeatPage() {
  const navigate = useNavigate();
  const { movie, theatre, seats, applyFixedSelection } = useBooking();
  if (!movie || !theatre) return <Navigate to="/dashboard" replace />;
  function selectSeats(): void {
    applyFixedSelection();
    navigate('/payment');
  }
  return (
    <main className="panel">
      <p className="eyebrow">{movie.title.toUpperCase()} / {theatre.name.toUpperCase()}</p>
      <h1>Find your seats</h1>
      <p aria-live="polite">{seats.length ? `Selected: ${seats.join(', ')} · Rs. 450` : 'No seats selected yet.'}</p>
      <div aria-label="Theatre seat grid" className="seat-grid">
        {allSeats.map((seat) => <span aria-label={`${seat}${seats.includes(seat) ? ' selected' : ' unselected'}`} className={seats.includes(seat) ? 'seat selected' : 'seat'} key={seat}>{seat}</span>)}
      </div>
      <button className="button" type="button" onClick={selectSeats}>Select Seats</button>
    </main>
  );
}