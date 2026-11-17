import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { ROLES, type Role } from '../constants/roles';
import type { AuthUser } from '../types/express';

interface TokenPayload {
  sub: string;
  role: Role;
}

export function signToken(user: AuthUser): string {
  const payload: TokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Returns the authenticated user, or throws if the token is invalid or expired. */
export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof decoded !== 'object' ||
    typeof decoded.sub !== 'string' ||
    !ROLES.includes(decoded.role)
  ) {
    throw new Error('Malformed token payload');
  }
  return { id: decoded.sub, role: decoded.role };
}
