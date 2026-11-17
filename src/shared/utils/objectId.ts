import { z } from 'zod';
import { isValidObjectId } from 'mongoose';

/** Zod schema for a MongoDB ObjectId string, for use in params/body validators. */
export const objectId = z.string().refine((v) => isValidObjectId(v), { message: 'Invalid id' });
