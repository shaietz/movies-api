import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError';

interface RequestSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

/**
 * Validates request parts with Zod. Parsed (coerced, defaulted) values are put on
 * `req.validated`, and the parsed body also replaces `req.body`.
 * In Express 5 `req.query` is read-only, so controllers read query values from
 * `req.validated.query`.
 */
export const validate =
  (schemas: RequestSchemas): RequestHandler =>
  (req, _res, next) => {
    const validated: NonNullable<typeof req.validated> = {};
    const issues: { location: string; path: string; message: string }[] = [];

    for (const location of ['params', 'query', 'body'] as const) {
      const schema = schemas[location];
      if (!schema) continue;
      const result = schema.safeParse(req[location] ?? {});
      if (result.success) {
        validated[location] = result.data;
      } else {
        for (const issue of result.error.issues) {
          issues.push({ location, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (issues.length > 0) return next(AppError.validation(issues));

    req.validated = validated;
    if (validated.body !== undefined) req.body = validated.body;
    return next();
  };
