import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../../../src/shared/errors/AppError';
import { errorHandler } from '../../../src/shared/middleware/errorHandler';

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

const handle = (err: unknown) => {
  const res = mockRes();
  errorHandler(err, {} as Request, res as unknown as Response, jest.fn());
  return res;
};

describe('errorHandler', () => {
  it('serializes an AppError', () => {
    const res = handle(AppError.notFound('Movie'));
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Movie not found' } });
  });

  it('maps a Mongo duplicate key error to 409', () => {
    expect(handle({ code: 11000, keyValue: { email: 'a@b.c' } }).statusCode).toBe(409);
  });

  it('maps a Mongoose CastError to 400', () => {
    const err = new mongoose.Error.CastError('ObjectId', 'abc', '_id');
    expect(handle(err).statusCode).toBe(400);
  });

  it('maps a Mongoose ValidationError to 400 with details', () => {
    const err = new mongoose.Error.ValidationError();
    err.addError(
      'title',
      new mongoose.Error.ValidatorError({ message: 'Required', path: 'title' }),
    );
    const res = handle(err);
    expect(res.statusCode).toBe(400);
    expect(res.body).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
  });

  it('hides unknown errors behind a generic 500', () => {
    const res = handle(new Error('db password is hunter2'));
    expect(res.statusCode).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });
});
