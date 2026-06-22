import * as crypto from 'crypto';
import * as argon2 from 'argon2';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET =
  process.env.JWT_SECRET || 'super-secret-jwt-key-for-echodocs-auth';

/**
 * Hash a password using Argon2
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password);
}

/**
 * Verify a password against its stored Argon2 hash
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    return await argon2.verify(storedHash, password);
  } catch (error) {
    return false;
  }
}

/**
 * Sign an Access Token (expires in 15 minutes)
 */
export function signAccessToken(payload: any): string {
  const { iat, exp, type, ...cleanPayload } = payload;
  return jwt.sign({ ...cleanPayload, type: 'access' }, JWT_SECRET, { expiresIn: '15m' });
}

/**
 * Sign a Refresh Token (expires in 15 days)
 */
export function signRefreshToken(payload: any): string {
  const { iat, exp, type, ...cleanPayload } = payload;
  return jwt.sign({ ...cleanPayload, type: 'refresh' }, JWT_SECRET, { expiresIn: '15d' });
}

/**
 * Verify and parse an Access Token
 */
export function verifyAccessToken(token: string): any {
  const payload = jwt.verify(token, JWT_SECRET) as any;
  if (payload.type !== 'access') {
    throw new Error('Invalid token type (expected access token)');
  }
  return payload;
}

/**
 * Verify and parse a Refresh Token
 */
export function verifyRefreshToken(token: string): any {
  const payload = jwt.verify(token, JWT_SECRET) as any;
  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type (expected refresh token)');
  }
  return payload;
}
