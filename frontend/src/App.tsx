import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
/** Define the single application router and auth scope. */
export default function App(){return <AuthProvider><BrowserRouter><Routes><Route path="/" element={<LandingPage/>}/><Route path="/login" element={<LoginPage/>}/><Route path="/otp" element={<OtpPage/>}/><Route element={<RequireAuth/>}><Route path="/dashboard" element={<main className="panel"><h1>Films loading soon</h1></main>}/></Route></Routes></BrowserRouter></AuthProvider>}