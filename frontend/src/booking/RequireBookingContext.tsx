import { Navigate, Outlet } from 'react-router-dom';
import { useBooking } from './BookingContext';

type RequiredBookingStep = 'theatre' | 'payment';

interface RequireBookingContextProps {
  step: RequiredBookingStep;
}

/** Redirect incomplete direct visits to the closest route that can restore the flow. */
export default function RequireBookingContext({ step }: RequireBookingContextProps) {
  const { movie, theatre, seats, totalPrice } = useBooking();

  if (!movie) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!theatre) {
    return <Navigate to="/theatres" replace />;
  }

  if (step === 'payment' && (seats.join(',') !== 'A1,A2,A3' || totalPrice !== 450)) {
    return <Navigate to="/seats" replace />;
  }

  return <Outlet />;
}
