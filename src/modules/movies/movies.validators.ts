import { z } from 'zod';
import { FIRST_FILM_YEAR, GENRES, RATING_MAX } from '../../shared/constants/movies';
import { objectId } from '../../shared/utils/objectId';
import { paginationQuery } from '../../shared/utils/pagination';

const maxYear = () => new Date().getFullYear() + 5;

const year = z.coerce
  .number()
  .int()
  .min(FIRST_FILM_YEAR)
  .refine((y) => y <= maxYear(), { message: 'Release year is too far in the future' });

export const movieIdParams = z.object({ id: objectId });

const movieFields = {
  title: z.string().trim().min(1).max(200),
  releaseYear: year,
  genres: z.array(z.enum(GENRES)).min(1),
  director: z.string().trim().min(1).max(100),
  actors: z.array(z.string().trim().min(1).max(100)),
  description: z.string().trim().max(2000),
};

/** strictObject rejects unknown keys, so clients can't set ratingAverage / reviewCount / createdBy. */
export const createMovieSchema = z.strictObject({
  ...movieFields,
  actors: movieFields.actors.default([]),
  description: movieFields.description.default(''),
});

export const updateMovieSchema = z
  .strictObject(movieFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'Provide at least one field to update' });

export const MOVIE_SORT_FIELDS = [
  'title',
  '-title',
  'releaseYear',
  '-releaseYear',
  'ratingAverage',
  '-ratingAverage',
  'reviewCount',
  '-reviewCount',
  'createdAt',
  '-createdAt',
] as const;

export const searchMoviesQuery = z
  .object({
    ...paginationQuery,
    /** Partial, case-insensitive match on title. */
    q: z.string().trim().min(1).optional(),
    genre: z.enum(GENRES).optional(),
    director: z.string().trim().min(1).optional(),
    actor: z.string().trim().min(1).optional(),
    yearFrom: year.optional(),
    yearTo: year.optional(),
    minRating: z.coerce.number().min(0).max(RATING_MAX).optional(),
    sort: z.enum(MOVIE_SORT_FIELDS).default('-createdAt'),
  })
  .refine((v) => !v.yearFrom || !v.yearTo || v.yearFrom <= v.yearTo, {
    message: 'yearFrom must be less than or equal to yearTo',
    path: ['yearFrom'],
  });

export type CreateMovieInput = z.infer<typeof createMovieSchema>;
export type UpdateMovieInput = z.infer<typeof updateMovieSchema>;
export type SearchMoviesQuery = z.infer<typeof searchMoviesQuery>;
