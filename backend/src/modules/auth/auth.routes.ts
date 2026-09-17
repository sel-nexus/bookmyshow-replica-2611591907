import { Router } from 'express';
import { z } from 'zod';
import type { AuthService } from './auth.service';
/** Adapt authentication HTTP requests to service operations. */
export function createAuthRouter(service: AuthService): Router {
 const router=Router(); const login=z.object({mobileNumber:z.string().min(10).max(15)}); const verify=login.extend({otp:z.string()});
 router.post('/login',(req,res,next)=>{try { res.status(200).json(service.initiate(login.parse(req.body).mobileNumber)); } catch(error){next(error);}});
 router.post('/verify',(req,res,next)=>{try { const input=verify.parse(req.body); const session=service.verify(input.mobileNumber,input.otp); if(!session) return res.status(401).json({error:'Verification failed'}); res.status(200).json(session); } catch(error){next(error);}});
 return router;
}