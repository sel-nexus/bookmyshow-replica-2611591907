import jwt, { type SignOptions } from 'jsonwebtoken';
import type Database from 'better-sqlite3';
/** Own deterministic OTP authentication decisions. */
export class AuthService {
  constructor(private readonly db: Database.Database, private readonly secret: string, private readonly expiresIn: NonNullable<SignOptions['expiresIn']>) {}
  /** Start the bounded OTP flow. */
  initiate(mobileNumber: string) { return { initiated: true, mobileNumber }; }
  /** Verify the prescribed OTP and issue a session. */
  verify(mobileNumber: string, otp: string) {
    if (otp !== '1234') return null;
    this.db.prepare('INSERT OR IGNORE INTO users (mobile_number) VALUES (?)').run(mobileNumber);
    const user = this.db.prepare('SELECT id, mobile_number AS mobileNumber FROM users WHERE mobile_number=?').get(mobileNumber) as {id:number;mobileNumber:string};
    return { token: jwt.sign({ sub: user.id, mobileNumber }, this.secret, { expiresIn: this.expiresIn }), user };
  }
}