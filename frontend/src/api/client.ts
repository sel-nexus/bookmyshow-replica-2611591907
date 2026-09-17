import type { AuthSession, BookingConfirmation, LoginInitiated, Movie, Theatre } from '../types';
const baseUrl=import.meta.env.VITE_API_BASE_URL ?? '';
/** Send typed JSON to the backend and surface bounded errors. */
async function request<T>(path:string, init:RequestInit={}):Promise<T>{const response=await fetch(`${baseUrl}${path}`,{headers:{'Content-Type':'application/json',...init.headers},...init}); if(!response.ok) throw new Error('Request failed'); return response.json() as Promise<T>;}
/** Start the OTP journey. */
export const login=(mobileNumber:string)=>request<LoginInitiated>('/api/auth/login',{method:'POST',body:JSON.stringify({mobileNumber})});
/** Verify OTP and retrieve the backend-issued session. */
export const verify=(mobileNumber:string,otp:string)=>request<AuthSession>('/api/auth/verify',{method:'POST',body:JSON.stringify({mobileNumber,otp})});
/** Retrieve movies from the API-owned catalogue. */
export const getMovies=()=>request<Movie[]>('/api/movies');
/** Retrieve only the theatres offered for the selected movie. */
export const getTheatresForMovie=(movieId:number)=>request<Theatre[]>(`/api/movies/${movieId}/theatres`);
/** Persist the fixed booking payload after client-side processing completes. */
export const createBooking=(input:{movieId:number;theatreId:number;seats:string[];paymentMethod:'CARD'|'UPI';totalPrice:450},token:string)=>request<BookingConfirmation>('/api/bookings',{method:'POST',headers:{Authorization:`Bearer ${token}`},body:JSON.stringify(input)});