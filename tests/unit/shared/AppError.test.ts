import { AppError } from '../../../src/shared/errors/AppError';

describe('AppError', () => {
  it.each([
    [AppError.badRequest(), 400, 'BAD_REQUEST'],
    [AppError.validation([]), 400, 'VALIDATION_ERROR'],
    [AppError.unauthorized(), 401, 'UNAUTHORIZED'],
    [AppError.forbidden(), 403, 'FORBIDDEN'],
    [AppError.notFound('Movie'), 404, 'NOT_FOUND'],
    [AppError.conflict(), 409, 'CONFLICT'],
  ])('%o has status %i and code %s', (error, status, code) => {
    expect(error).toBeInstanceOf(Error);
    expect(error.statusCode).toBe(status);
    expect(error.code).toBe(code);
  });

  it('builds a "not found" message from the resource name', () => {
    expect(AppError.notFound('Movie').message).toBe('Movie not found');
  });

  it('keeps validation details', () => {
    const details = [{ path: 'title', message: 'Required' }];
    expect(AppError.validation(details).details).toEqual(details);
  });
});
