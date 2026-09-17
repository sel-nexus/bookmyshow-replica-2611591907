import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
/** Require and decode a bearer JWT for protected APIs. */
export function requireAuth(secret: string) { return (req: Request & {auth?:{userId:number}}, res:Response, next:NextFunction) => { try { const token=req.header('authorization')?.replace('Bearer ',''); if(!token) return res.status(401).json({error:'Unauthorized'}); const payload=jwt.verify(token,secret) as {sub:string|number}; req.auth={userId:Number(payload.sub)}; next(); } catch { res.status(401).json({error:'Unauthorized'}); } }; }