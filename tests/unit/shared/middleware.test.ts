import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../../src/shared/errors/AppError';
import { authenticate, optionalAuthenticate } from '../../../src/shared/middleware/authenticate';
import { authorize } from '../../../src/shared/middleware/authorize';
import { validate } from '../../../src/shared/middleware/validate';
import { signToken } from '../../../src/shared/utils/jwt';

const mockReq = (overrides: Partial<Request> = {}) =>
  ({ headers: {}, body: {}, params: {}, query: {}, ...overrides }) as Request;
const res = {} as Response;

/** Calls the middleware and returns what it passed to next(). */
function run(mw: (req: Request, res: Response, next: NextFunction) => void, req: Request) {
  const next = jest.fn();
  mw(req, res, next);
  expect(next).toHaveBeenCalledTimes(1);
  return next.mock.calls[0][0] as AppError | undefined;
}

describe('authenticate', () => {
  it('sets req.user from a valid bearer token', () => {
    const req = mockReq({
      headers: { authorization: `Bearer ${signToken({ id: 'u1', role: 'user' })}` },
    });
    expect(run(authenticate, req)).toBeUndefined();
    expect(req.user).toEqual({ id: 'u1', role: 'user' });
  });

  it.each([
    ['no header', undefined],
    ['wrong scheme', 'Basic abc'],
    ['missing token', 'Bearer '],
    ['garbage token', 'Bearer not.a.jwt'],
  ])('returns 401 for %s', (_label, authorization) => {
    const err = run(authenticate, mockReq({ headers: { authorization } }));
    expect(err).toBeInstanceOf(AppError);
    expect(err!.statusCode).toBe(401);
  });
});

describe('optionalAuthenticate', () => {
  it('lets anonymous requests through', () => {
    const req = mockReq();
    expect(run(optionalAuthenticate, req)).toBeUndefined();
    expect(req.user).toBeUndefined();
  });

  it('still rejects an invalid token', () => {
    const err = run(optionalAuthenticate, mockReq({ headers: { authorization: 'Bearer nope' } }));
    expect(err!.statusCode).toBe(401);
  });
});

describe('authorize', () => {
  it('allows a matching role', () => {
    expect(run(authorize('admin'), mockReq({ user: { id: 'a', role: 'admin' } }))).toBeUndefined();
  });

  it('returns 403 for a non-matching role', () => {
    expect(run(authorize('admin'), mockReq({ user: { id: 'u', role: 'user' } }))!.statusCode).toBe(
      403,
    );
  });

  it('returns 401 when there is no user', () => {
    expect(run(authorize('admin'), mockReq())!.statusCode).toBe(401);
  });
});

describe('validate', () => {
  const schemas = {
    body: z.object({ name: z.string().min(1), tags: z.array(z.string()).default([]) }),
    query: z.object({ page: z.coerce.number().int().default(1) }),
  };

  it('stores parsed values and applies defaults/coercion', () => {
    const req = mockReq({ body: { name: 'x' }, query: { page: '3' } as Request['query'] });
    expect(run(validate(schemas), req)).toBeUndefined();
    expect(req.body).toEqual({ name: 'x', tags: [] });
    expect(req.validated!.query).toEqual({ page: 3 });
  });

  it('collects issues from every request part into one 400 error', () => {
    const req = mockReq({ body: { name: '' }, query: { page: 'abc' } as Request['query'] });
    const err = run(validate(schemas), req)!;
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ location: 'body', path: 'name' }),
        expect.objectContaining({ location: 'query', path: 'page' }),
      ]),
    );
  });
});
