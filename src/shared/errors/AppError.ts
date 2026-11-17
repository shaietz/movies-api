export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL_ERROR';

/**
 * The only error type services should throw on purpose.
 * The central error handler turns it into a consistent JSON response.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message = 'Bad request', details?: unknown) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static validation(details: unknown, message = 'Validation failed') {
    return new AppError(400, 'VALIDATION_ERROR', message, details);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'You are not allowed to perform this action') {
    return new AppError(403, 'FORBIDDEN', message);
  }

  static notFound(resource = 'Resource') {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(message = 'Resource already exists') {
    return new AppError(409, 'CONFLICT', message);
  }

  /** Placeholder used by skeleton stubs. Remove once the feature is implemented. */
  static notImplemented(feature: string) {
    return new AppError(501, 'NOT_IMPLEMENTED', `${feature} is not implemented yet`);
  }
}
