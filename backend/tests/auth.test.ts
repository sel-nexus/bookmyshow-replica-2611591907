import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { openDatabase } from '../src/db/database';
const app=createApp(openDatabase(':memory:'),{port:0,sqlitePath:':memory:',jwtSecret:'test-secret',jwtExpiresIn:'30m',corsOrigin:'http://localhost'});
describe('authentication API',()=>{
 it('initiates and verifies OTP 1234 with a SQLite-backed JWT user',async()=>{const login=await request(app).post('/api/auth/login').send({mobileNumber:'9876543210'}); expect(login.status).toBe(200); expect(login.body).toEqual({initiated:true,mobileNumber:'9876543210'}); const verify=await request(app).post('/api/auth/verify').send({mobileNumber:'9876543210',otp:'1234'}); expect(verify.status).toBe(200); expect(verify.body.token).toEqual(expect.any(String)); expect(verify.body.user.mobileNumber).toBe('9876543210');});
 it('rejects invalid OTP and malformed input without issuing a token',async()=>{expect((await request(app).post('/api/auth/verify').send({mobileNumber:'9876543210',otp:'0000'})).status).toBe(401); expect((await request(app).post('/api/auth/login').send({mobileNumber:'bad'})).status).toBe(400);});
 it('reports health',async()=>{const response=await request(app).get('/api/health'); expect(response.status).toBe(200); expect(response.body.status).toBe('ok');});
});