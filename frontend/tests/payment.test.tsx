import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../src/auth/AuthContext';
import { BookingProvider, useBooking } from '../src/booking/BookingContext';
import PaymentPage from '../src/pages/PaymentPage';
import * as api from '../src/api/client';
function Ready(){const auth=useAuth();const booking=useBooking();useEffect(()=>{auth.setSession({token:'token',user:{id:1,mobileNumber:'987'}});booking.selectMovie({id:1,title:'Paradise'});booking.selectTheatre({id:1,name:'Sandhya 70mm'});booking.applyFixedSelection();},[]);return <PaymentPage/>;}
function renderReady(){return render(<MemoryRouter><AuthProvider><BookingProvider><Ready/></BookingProvider></AuthProvider></MemoryRouter>);}
afterEach(()=>vi.useRealTimers());
describe('payment page',()=>{it('switches Card and UPI fields without retaining prior dummy input',async()=>{renderReady();expect(await screen.findByLabelText('Card Number')).toBeVisible();fireEvent.change(screen.getByLabelText('Card Number'),{target:{value:'4111'}});fireEvent.click(screen.getByLabelText('UPI'));expect(screen.getByLabelText('UPI ID')).toBeVisible();expect(screen.queryByLabelText('Card Number')).toBeNull();});it('shows processing and sends exactly one request only after 2000ms',async()=>{const spy=vi.spyOn(api,'createBooking').mockResolvedValue({confirmationId:'BMS-1',movie:{id:1,title:'Paradise'},theatre:{id:1,name:'Sandhya 70mm'},seats:['A1','A2','A3']});renderReady();const payButton=await screen.findByRole('button',{name:'Pay Rs. 450'});vi.useFakeTimers();fireEvent.click(payButton);expect(screen.getByRole('status')).toHaveTextContent('Processing Payment...');expect(spy).not.toHaveBeenCalled();vi.advanceTimersByTime(1999);expect(spy).not.toHaveBeenCalled();vi.advanceTimersByTime(1);expect(spy).toHaveBeenCalledTimes(1);});});