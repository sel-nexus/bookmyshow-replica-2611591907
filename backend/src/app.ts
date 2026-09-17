import express from 'express';
import cors from 'cors';
import type Database from 'better-sqlite3';
import { loadConfig, type Config } from './config';
import { AuthService } from './modules/auth/auth.service';
import { createAuthRouter } from './modules/auth/auth.routes';
import { errorHandler } from './middleware/error-handler';
/** Compose the Express API and its dependency graph. */
export function createApp(db: Database.Database, config: Config = loadConfig()) { const app=express(); app.use(cors({origin:config.corsOrigin})); app.use(express.json({limit:'10kb'})); app.get('/api/health',(_req,res)=>res.status(200).json({status:'ok'})); app.use('/api/auth',createAuthRouter(new AuthService(db,config.jwtSecret,config.jwtExpiresIn))); app.use(errorHandler); return app; }