import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api/client';
import { AuthProvider } from '../src/auth/AuthContext';
import RequireAuth from '../src/auth/RequireAuth';
import LoginPage from '../src/pages/LoginPage';
import OtpPage from '../src/pages/OtpPage';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('authentication journey', () => {
  it('calls login only after submit and moves to OTP state', async () => {
    const user = userEvent.setup();
    const login = vi.spyOn(api, 'login').mockResolvedValue({ initiated: true, mobileNumber: '9876543210' });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Mobile number'), '9876543210');
    expect(login).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Send OTP' }));
    expect(login).toHaveBeenCalledWith('9876543210');
  });

  it('shows a bounded login failure', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'login').mockRejectedValue(new Error('bad request'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText('Mobile number'), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Send OTP' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('valid mobile number');
  });

  it('verifies the OTP, establishes session, and enters the dashboard', async () => {
    const user = userEvent.setup();
    const verify = vi.spyOn(api, 'verify').mockResolvedValue({
      token: 'token',
      user: { id: 1, mobileNumber: '9876543210' },
    });

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[{ pathname: '/otp', state: { mobileNumber: '9876543210' } }]}>
          <Routes>
            <Route path="/otp" element={<OtpPage />} />
            <Route path="/dashboard" element={<h1>Dashboard</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText('One-time password'), '1234');
    await user.click(screen.getByRole('button', { name: 'Verify and continue' }));
    expect(verify).toHaveBeenCalledWith('9876543210', '1234');
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  it('keeps the visitor on OTP and renders a bounded verification error', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'verify').mockRejectedValue(new Error('invalid otp'));

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[{ pathname: '/otp', state: { mobileNumber: '9876543210' } }]}>
          <OtpPage />
        </MemoryRouter>
      </AuthProvider>,
    );

    await user.type(screen.getByLabelText('One-time password'), '0000');
    await user.click(screen.getByRole('button', { name: 'Verify and continue' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('OTP could not be verified');
  });

  it('redirects an unauthenticated protected route to login', async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<h1>Protected dashboard</h1>} />
            </Route>
            <Route path="/login" element={<h1>Login</h1>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Login' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Protected dashboard' })).not.toBeInTheDocument();
  });
});

describe('API client errors', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('unwraps catalogue responses and exposes server error messages', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ movies: [{ id: 1, title: 'Paradise' }] }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Movie not found' }), { status: 404 }));
    vi.stubGlobal('fetch', fetch);

    await expect(api.getMovies()).resolves.toEqual([{ id: 1, title: 'Paradise' }]);
    await expect(api.getTheatresForMovie(99)).rejects.toThrow('Movie not found');
  });

  it('preserves a network failure from fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(api.login('9876543210')).rejects.toThrow('Failed to fetch');
  });
});
