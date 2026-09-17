import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api/client';
import { BookingProvider, useBooking } from '../src/booking/BookingContext';
import DashboardPage from '../src/pages/DashboardPage';
import TheatrePage from '../src/pages/TheatrePage';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

/** Render selected booking records so the route transition has visible evidence. */
function SeatDestination() {
  const { movie, theatre } = useBooking();
  return <p>{`${movie?.title ?? 'none'} at ${theatre?.name ?? 'none'}`}</p>;
}

function SelectedMovieTheatrePage() {
  const { selectMovie } = useBooking();

  useEffect(() => {
    selectMovie({ id: 1, title: 'Paradise' });
  }, []);

  return <TheatrePage />;
}

function renderDashboard() {
  return render(
    <BookingProvider>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </BookingProvider>,
  );
}

function renderTheatres() {
  return render(
    <BookingProvider>
      <MemoryRouter>
        <SelectedMovieTheatrePage />
      </MemoryRouter>
    </BookingProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('discovery flow', () => {
  it('loads a movie, then exposes only its mapped theatres and carries both selections forward', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'getMovies').mockResolvedValue([{ id: 1, title: 'Paradise' }]);
    vi.spyOn(api, 'getTheatresForMovie').mockResolvedValue({
      movie: { id: 1, title: 'Paradise' },
      theatres: [{ id: 1, name: 'Sandhya 70mm' }],
    });

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

    await user.click(await screen.findByRole('button', { name: 'Paradise' }));
    await user.click(await screen.findByRole('button', { name: 'Sandhya 70mm' }));

    expect(screen.getByText('Paradise at Sandhya 70mm')).toBeInTheDocument();
  });

  it('renders Dashboard loading before its live catalogue settles', async () => {
    const movies = deferred<{ id: number; title: string }[]>();
    vi.spyOn(api, 'getMovies').mockReturnValue(movies.promise);

    renderDashboard();

    expect(screen.getByRole('status')).toHaveTextContent('Loading movies…');
    movies.resolve([]);
    expect(await screen.findByText('No movies are currently available.')).toBeVisible();
  });

  it('renders Dashboard failure and empty outcomes', async () => {
    vi.spyOn(api, 'getMovies').mockRejectedValueOnce(new Error('offline'));
    const { unmount } = renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load movies');
    unmount();
    vi.spyOn(api, 'getMovies').mockResolvedValueOnce([]);

    renderDashboard();
    expect(await screen.findByText('No movies are currently available.')).toBeVisible();
  });

  it('renders Theatre loading before mapped theatres settle', async () => {
    const theatres = deferred<Awaited<ReturnType<typeof api.getTheatresForMovie>>>();
    vi.spyOn(api, 'getTheatresForMovie').mockReturnValue(theatres.promise);

    renderTheatres();

    expect(await screen.findByRole('status')).toHaveTextContent('Loading theatres…');
    theatres.resolve({ movie: { id: 1, title: 'Paradise' }, theatres: [] });
    expect(await screen.findByText('No theatres are currently available for this movie.')).toBeVisible();
  });

  it('renders Theatre failure and empty outcomes', async () => {
    vi.spyOn(api, 'getTheatresForMovie').mockRejectedValueOnce(new Error('offline'));
    const { unmount } = renderTheatres();

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load theatres');
    unmount();
    vi.spyOn(api, 'getTheatresForMovie').mockResolvedValueOnce({
      movie: { id: 1, title: 'Paradise' },
      theatres: [],
    });

    renderTheatres();
    expect(await screen.findByText('No theatres are currently available for this movie.')).toBeVisible();
  });
});
