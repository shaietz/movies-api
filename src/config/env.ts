import dotenv from 'dotenv';
import { z } from 'zod';

// quiet: dotenv v17+ otherwise logs "injected env (n) from .env" on every load,
// which floods the test output (once per test file).
dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGO_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/movie-reviews'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', z.treeifyError(parsed.error));
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
export type Env = typeof env;
