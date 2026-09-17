import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api/client';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { BookingProvider, useBooking } from '../src/booking/BookingContext';
import RequireBookingContext from '../src/booking/RequireBookingContext';
import PaymentPage from '../src/pages/PaymentPage';

function ReadyPaymentPage() {
  const auth = useAuth();
  const booking = useBooking();

  useEffect(() => {
    auth.setSession({ token: 'token', user: { id: 1, mobileNumber: '987' } });
    booking.selectMovie({ id: 1, title: 'Paradise' });
    booking.selectTheatre({ id: 1, name: 'Sandhya 70mm' });
    booking.applyFixedSelection();
  }, []);

  return <PaymentPage />;
}

function ConfirmationDestination() {
  return <h1>Booking complete</h1>;
}

function renderReady(withConfirmationRoute = false) {
  return render(
    <MemoryRouter initialEntries={['/payment']}>
      <AuthProvider>
        <BookingProvider>
          {withConfirmationRoute ? (
            <Routes>
              <Route path="/payment" element={<ReadyPaymentPage />} />
              <Route path="/confirmation/:confirmationId" element={<ConfirmationDestination />} />
            </Routes>
          ) : (
            <ReadyPaymentPage />
          )}
        </BookingProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

const confirmation = {
  confirmationId: 'BMS-1',
  movie: { id: 1, title: 'Paradise' },
  theatre: { id: 1, name: 'Sandhya 70mm' },
  seats: ['A1', 'A2', 'A3'],
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('payment page', () => {
  it('switches Card and UPI fields without retaining the prior dummy input', async () => {
    const user = userEvent.setup();
    renderReady();

    await user.type(await screen.findByLabelText('Card Number'), '4111');
    await user.click(screen.getByLabelText('UPI'));

    expect(screen.getByLabelText('UPI ID')).toBeVisible();
    expect(screen.queryByLabelText('Card Number')).not.toBeInTheDocument();
  });

  it('shows processing until the two-second boundary and then completes the visible booking flow', async () => {
    vi.spyOn(api, 'createBooking').mockResolvedValue(confirmation);
    renderReady(true);
    const payButton = await screen.findByRole('button', { name: 'Pay Rs. 450' });
    vi.useFakeTimers();

    fireEvent.click(payButton);
    expect(screen.getByRole('status')).toHaveTextContent('Processing Payment...');
    await vi.advanceTimersByTimeAsync(1999);
    expect(screen.getByRole('status')).toHaveTextContent('Processing Payment...');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByRole('heading', { name: 'Booking complete' })).toBeVisible();
  });

  it('returns to usable payment controls after a rejected booking and allows a successful retry', async () => {
    vi.spyOn(api, 'createBooking')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(confirmation);
    renderReady(true);
    const payButton = await screen.findByRole('button', { name: 'Pay Rs. 450' });
    vi.useFakeTimers();

    fireEvent.click(payButton);
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Unable to save your booking. Please try again.');
    expect(screen.getByRole('button', { name: 'Pay Rs. 450' })).toBeEnabled();
    expect(screen.getByLabelText('Card Number')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: 'Pay Rs. 450' }));
    expect(screen.getByRole('status')).toHaveTextContent('Processing Payment...');
    await act(async () => {
      vi.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    expect(screen.getByRole('heading', { name: 'Booking complete' })).toBeVisible();
  });

  it('redirects a direct payment visit with no fixed selection to seats', async () => {
    render(
      <AuthProvider>
        <BookingProvider>
          <MemoryRouter initialEntries={['/payment']}>
            <Routes>
              <Route element={<RequireBookingContext step="payment" />}>
                <Route path="/payment" element={<PaymentPage />} />
              </Route>
              <Route path="/dashboard" element={<h1>Dashboard</h1>} />
              <Route path="/seats" element={<h1>Seats</h1>} />
            </Routes>
          </MemoryRouter>
        </BookingProvider>
      </AuthProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});
