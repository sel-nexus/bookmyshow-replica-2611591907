import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
/** Redirect visitors without a verified session to login. */
export default function RequireAuth(){return useAuth().session ? <Outlet /> : <Navigate to="/login" replace />;}