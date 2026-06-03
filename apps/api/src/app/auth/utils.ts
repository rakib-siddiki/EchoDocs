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
 * Sign a payload as JWT using jsonwebtoken package
 */
export function signJwt(payload: any, expiresInSeconds = 86400): string {
  const { iat, exp, ...cleanPayload } = payload;
  return jwt.sign(cleanPayload, JWT_SECRET, { expiresIn: expiresInSeconds });
}

/**
 * Verify and parse a JWT using jsonwebtoken package
 */
export function verifyJwt(token: string): any {
  return jwt.verify(token, JWT_SECRET);
}
