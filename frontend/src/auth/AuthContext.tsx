import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { AuthSession } from '../types';
interface AuthValue { session:AuthSession|null; setSession:(session:AuthSession)=>void; clearSession:()=>void; }
const AuthContext=createContext<AuthValue|null>(null);
/** Provide transient authenticated identity to protected routes. */
export function AuthProvider({children}:{children:ReactNode}){const [session,setSession]=useState<AuthSession|null>(null);const value=useMemo(()=>({session,setSession,clearSession:()=>setSession(null)}),[session]);return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;}
/** Read the required auth context. */
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('AuthProvider is required');return value;}