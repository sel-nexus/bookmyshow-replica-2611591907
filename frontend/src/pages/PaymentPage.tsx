import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { createBooking } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useBooking } from '../booking/BookingContext';

/** Collect a dummy method and submit one booking after the required delay. */
export default function PaymentPage() {
  const { session } = useAuth();
  const { movie, theatre, seats, totalPrice } = useBooking();
  const navigate = useNavigate();
  const [method, setMethod] = useState<'CARD' | 'UPI'>('CARD');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upi, setUpi] = useState('');
  const validContext = Boolean(movie && theatre && session && seats.join(',') === 'A1,A2,A3' && totalPrice === 450);

  useEffect(() => {
    if (!processing || !validContext || !movie || !theatre || !session) return;
    let active = true;
    const timer = window.setTimeout(() => {
      void createBooking({ movieId: movie.id, theatreId: theatre.id, seats, paymentMethod: method, totalPrice: 450 }, session.token)
        .then((confirmation) => { if (active) navigate('/confirmation', { state: { confirmation } }); })
        .catch(() => { if (active) { setProcessing(false); setError('Unable to save your booking. Please try again.'); } });
    }, 2000);
    return () => { active = false; window.clearTimeout(timer); };
  }, [processing, validContext, movie, theatre, seats, method, session, navigate]);

  if (!validContext) return <Navigate to="/dashboard" replace />;
  function switchMethod(value: 'CARD' | 'UPI'): void { setMethod(value); setCard(''); setExpiry(''); setCvv(''); setUpi(''); }
  function pay(): void { if (!processing) { setProcessing(true); setError(''); setCard(''); setExpiry(''); setCvv(''); setUpi(''); } }
  return (
    <main className="panel">
      <p className="eyebrow">PAYMENT / RS. 450</p>
      <h1>Choose a dummy payment method</h1>
      {processing ? <p role="status" aria-live="polite">Processing Payment...</p> : <>
        <fieldset><legend>Payment method</legend><label><input type="radio" checked={method === 'CARD'} onChange={() => switchMethod('CARD')} /> Card</label><label><input type="radio" checked={method === 'UPI'} onChange={() => switchMethod('UPI')} /> UPI</label></fieldset>
        {method === 'CARD' ? <div><label htmlFor="card">Card Number</label><input id="card" value={card} onChange={(event) => setCard(event.target.value)} /><label htmlFor="expiry">Expiry Date</label><input id="expiry" value={expiry} onChange={(event) => setExpiry(event.target.value)} /><label htmlFor="cvv">CVV</label><input id="cvv" value={cvv} onChange={(event) => setCvv(event.target.value)} /></div> : <div><label htmlFor="upi">UPI ID</label><input id="upi" placeholder="user@upi" value={upi} onChange={(event) => setUpi(event.target.value)} /></div>}
        <button className="button" type="button" onClick={pay} disabled={processing}>Pay Rs. 450</button>
        {error && <p role="alert">{error}</p>}
      </>}
    </main>
  );
}