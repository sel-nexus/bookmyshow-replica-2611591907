import { Router, type Request } from 'express';
import { z } from 'zod';
import type { BookingService } from './booking.service';
/** Adapt authenticated booking requests to the booking service. */
export function createBookingRouter(service:BookingService){const router=Router();const schema=z.object({movieId:z.number().int(),theatreId:z.number().int(),seats:z.array(z.string()),paymentMethod:z.enum(['CARD','UPI']),totalPrice:z.number().int()});router.post('/bookings',(req:Request & {auth?:{userId:number}},res,next)=>{try{res.status(201).json(service.create(req.auth!.userId,schema.parse(req.body)));}catch(error){next(error);}});return router;}