import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import { BookingProvider } from './booking/BookingContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import DashboardPage from './pages/DashboardPage';
import TheatrePage from './pages/TheatrePage';
import SeatPage from './pages/SeatPage';
import PaymentPage from './pages/PaymentPage';
import ConfirmationPage from './pages/ConfirmationPage';
/** Define the single application router and auth scope. */
export default function App(){return <AuthProvider><BookingProvider><BrowserRouter><Routes><Route path="/" element={<LandingPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/otp" element={<OtpPage/>}/><Route element={<RequireAuth/>}><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/theatres" element={<TheatrePage/>}/><Route path="/seats" element={<SeatPage/>}/><Route path="/payment" element={<PaymentPage/>}/><Route path="/confirmation" element={<ConfirmationPage/>}/></Route></Routes></BrowserRouter></BookingProvider></AuthProvider>}