import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import { BookingProvider } from './booking/BookingContext';
import RequireBookingContext from './booking/RequireBookingContext';
import ConfirmationPage from './pages/ConfirmationPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import PaymentPage from './pages/PaymentPage';
import SeatPage from './pages/SeatPage';
import TheatrePage from './pages/TheatrePage';

/** Define the single application router and auth scope. */
export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/otp" element={<OtpPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/theatres" element={<TheatrePage />} />
              <Route element={<RequireBookingContext step="theatre" />}>
                <Route path="/seats" element={<SeatPage />} />
              </Route>
              <Route element={<RequireBookingContext step="payment" />}>
                <Route path="/payment" element={<PaymentPage />} />
              </Route>
              <Route path="/confirmation/:confirmationId" element={<ConfirmationPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </BookingProvider>
    </AuthProvider>
  );
}
