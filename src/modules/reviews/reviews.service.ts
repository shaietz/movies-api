import { AppError } from '../../shared/errors/AppError';
import type { AuthUser } from '../../shared/types/express';
import type { Paginated } from '../../shared/utils/pagination';
import type { ReviewDocument } from './review.model';
import type { CreateReviewInput, ListReviewsQuery, UpdateReviewInput } from './reviews.validators';

export interface RatingStats {
  ratingAverage: number;
  reviewCount: number;
}

/** Pure helper for the rating stats. Rounded to one decimal; 0 when there are no reviews. */
export function calculateRatingStats(ratings: number[]): RatingStats {
  const reviewCount = ratings.length;
  if (reviewCount === 0) return { ratingAverage: 0, reviewCount: 0 };

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  const ratingAverage = Math.round((sum / reviewCount) * 10) / 10;
  return { ratingAverage, reviewCount };
}

/**
 * OWNER: reviews module
 *
 * listForMovie: public, paginated. -> 404 if the movie doesn't exist. Populate user.username.
 * getById:      public. -> 404 if missing.
 * create:       any logged-in user. -> 404 if movie missing, -> 409 if this user already
 *               reviewed this movie (unique index). Then recalculateMovieStats().
 * update:       author only (-> 403 otherwise). Then recalculateMovieStats().
 * remove:       author OR admin (-> 403 otherwise). Then recalculateMovieStats().
 * recalculateMovieStats: reads all ratings for the movie (aggregation) and writes
 *               ratingAverage + reviewCount onto the movie document.
 */
export const reviewsService = {
  async listForMovie(
    _movieId: string,
    _query: ListReviewsQuery,
  ): Promise<Paginated<ReviewDocument>> {
    throw AppError.notImplemented('reviews.listForMovie');
  },

  async getById(_id: string): Promise<ReviewDocument> {
    throw AppError.notImplemented('reviews.getById');
  },

  async create(
    _movieId: string,
    _input: CreateReviewInput,
    _userId: string,
  ): Promise<ReviewDocument> {
    throw AppError.notImplemented('reviews.create');
  },

  async update(_id: string, _input: UpdateReviewInput, _actor: AuthUser): Promise<ReviewDocument> {
    throw AppError.notImplemented('reviews.update');
  },

  async remove(_id: string, _actor: AuthUser): Promise<void> {
    throw AppError.notImplemented('reviews.remove');
  },

  async recalculateMovieStats(_movieId: string): Promise<void> {
    throw AppError.notImplemented('reviews.recalculateMovieStats');
  },
};
