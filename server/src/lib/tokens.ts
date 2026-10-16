import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from './env';

export function issueGuestToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}
