import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../errors/AppError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
};

function isDuplicateKeyError(err: unknown): err is { code: number; keyValue?: object } {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;
}

/** Converts any thrown error into `{ error: { code, message, details? } }`. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof mongoose.Error.ValidationError) {
    appError = AppError.validation(
      Object.values(err.errors).map((e) => ({ path: e.path, message: e.message })),
    );
  } else if (err instanceof mongoose.Error.CastError) {
    appError = AppError.badRequest(`Invalid value for ${err.path}`);
  } else if (isDuplicateKeyError(err)) {
    appError = AppError.conflict('Resource already exists');
  } else if (err instanceof SyntaxError && 'body' in err) {
    appError = AppError.badRequest('Malformed JSON body');
  } else {
    if (process.env.NODE_ENV !== 'test') console.error(err);
    appError = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong');
  }

  res.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message: appError.message,
      ...(appError.details !== undefined && { details: appError.details }),
    },
  });
};
