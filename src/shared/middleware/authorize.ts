import type { RequestHandler } from 'express';
import type { Role } from '../constants/roles';
import { AppError } from '../errors/AppError';

/** Must run after `authenticate`. Allows the request only for the given roles. */
export const authorize =
  (...allowed: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!allowed.includes(req.user.role)) return next(AppError.forbidden());
    return next();
  };
