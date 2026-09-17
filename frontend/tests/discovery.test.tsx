import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import * as api from '../src/api/client';
import { BookingProvider, useBooking } from '../src/booking/BookingContext';
import DashboardPage from '../src/pages/DashboardPage';
import TheatrePage from '../src/pages/TheatrePage';

/** Render selected booking records so the route transition has visible evidence. */
function SeatDestination() {
  const { movie, theatre } = useBooking();
  return <p>{`${movie?.title ?? 'none'} at ${theatre?.name ?? 'none'}`}</p>;
}

describe('discovery flow', () => {
  it('loads movies only after dashboard mount and requests mapped theatres after movie selection', async () => {
    const user = userEvent.setup();
    const movies = vi.spyOn(api, 'getMovies').mockResolvedValue([{ id: 1, title: 'Paradise' }]);
    const theatres = vi.spyOn(api, 'getTheatresForMovie').mockResolvedValue([{ id: 1, name: 'Sandhya' }]);

    render(
      <BookingProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/theatres" element={<TheatrePage />} />
            <Route path="/seats" element={<SeatDestination />} />
          </Routes>
        </MemoryRouter>
      </BookingProvider>,
    );

    expect(movies).toHaveBeenCalledTimes(1);
    expect(theatres).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: 'Paradise' }));
    expect(theatres).toHaveBeenCalledWith(1);
    await user.click(await screen.findByRole('button', { name: 'Sandhya' }));
    expect(screen.getByText('Paradise at Sandhya')).toBeInTheDocument();
  });

  it('reports a catalogue loading failure', async () => {
    vi.spyOn(api, 'getMovies').mockRejectedValue(new Error('offline'));

    render(
      <BookingProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </BookingProvider>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load movies');
  });
});
