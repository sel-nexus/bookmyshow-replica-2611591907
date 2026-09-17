import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BookingProvider, useBooking } from '../src/booking/BookingContext';
import RequireBookingContext from '../src/booking/RequireBookingContext';
import SeatPage from '../src/pages/SeatPage';

function SeededSeatPage() {
  const booking = useBooking();
  useEffect(() => {
    booking.selectMovie({ id: 1, title: 'Paradise' });
    booking.selectTheatre({ id: 1, name: 'Sandhya 70mm' });
  }, []);
  return <SeatPage />;
}

describe('seat selection and booking context', () => {
  it('starts unselected then applies only A1 A2 A3 at the fixed price', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <BookingProvider>
          <SeededSeatPage />
        </BookingProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('No seats selected yet.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Select Seats' }));
    expect(await screen.findByText('Selected: A1, A2, A3 · Rs. 450')).toBeVisible();
    expect(screen.getByLabelText('A1 selected')).toBeVisible();
    expect(screen.getByLabelText('A4 unselected')).toBeVisible();
  });

  it('redirects a direct seats visit to the dashboard without a movie', async () => {
    render(
      <BookingProvider>
        <MemoryRouter initialEntries={['/seats']}>
          <Routes>
            <Route element={<RequireBookingContext step="theatre" />}>
              <Route path="/seats" element={<SeatPage />} />
            </Route>
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          </Routes>
        </MemoryRouter>
      </BookingProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  it('redirects a seats visit to theatre selection when only a movie remains', async () => {
    function MovieOnlyRoute() {
      const booking = useBooking();
      const [ready, setReady] = useState(false);
      useEffect(() => {
        booking.selectMovie({ id: 1, title: 'Paradise' });
        setReady(true);
      }, []);
      return ready ? <RequireBookingContext step="theatre" /> : null;
    }

    render(
      <BookingProvider>
        <MemoryRouter initialEntries={['/seats']}>
          <Routes>
            <Route element={<MovieOnlyRoute />}>
              <Route path="/seats" element={<SeatPage />} />
            </Route>
            <Route path="/theatres" element={<h1>Theatres</h1>} />
          </Routes>
        </MemoryRouter>
      </BookingProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Theatres' })).toBeVisible();
  });
});
