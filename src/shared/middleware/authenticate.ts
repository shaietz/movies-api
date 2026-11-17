import type { RequestHandler } from 'express';
import { AppError } from '../errors/AppError';
import { verifyToken } from '../utils/jwt';

function readBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  return scheme === 'Bearer' && token ? token : null;
}

/** Requires a valid `Authorization: Bearer <jwt>` header. Sets `req.user`. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const token = readBearerToken(req.headers.authorization);
  if (!token) return next(AppError.unauthorized());

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(AppError.unauthorized('Invalid or expired token'));
  }
};

/** Like `authenticate`, but lets anonymous requests through (req.user stays undefined). */
export const optionalAuthenticate: RequestHandler = (req, _res, next) => {
  const token = readBearerToken(req.headers.authorization);
  if (!token) return next();

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(AppError.unauthorized('Invalid or expired token'));
  }
};
