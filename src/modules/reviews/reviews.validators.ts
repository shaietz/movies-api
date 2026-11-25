import { z } from 'zod';
import { RATING_MAX, RATING_MIN } from '../../shared/constants/movies';
import { objectId } from '../../shared/utils/objectId';
import { paginationQuery } from '../../shared/utils/pagination';

const rating = z.number().int().min(RATING_MIN).max(RATING_MAX);
const text = z.string().trim().max(5000);

export const movieReviewsParams = z.object({ movieId: objectId });
export const reviewIdParams = z.object({ id: objectId });

export const createReviewSchema = z.strictObject({
  rating,
  text: text.default(''),
});

export const updateReviewSchema = z
  .strictObject({ rating, text })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide rating and/or text' });

export const REVIEW_SORT_FIELDS = ['createdAt', '-createdAt', 'rating', '-rating'] as const;

export const listReviewsQuery = z.object({
  ...paginationQuery,
  sort: z.enum(REVIEW_SORT_FIELDS).default('-createdAt'),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewSortField = (typeof REVIEW_SORT_FIELDS)[number];
export type ListReviewsQuery = z.infer<typeof listReviewsQuery>;
