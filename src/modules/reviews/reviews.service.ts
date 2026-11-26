import { AppError } from '../../shared/errors/AppError';
import type { AuthUser } from '../../shared/types/express';
import { buildPaginated, type Paginated } from '../../shared/utils/pagination';
import { MovieModel } from '../movies/movie.model';
import { ReviewModel, type ReviewDocument } from './review.model';
import type {
  CreateReviewInput,
  ListReviewsQuery,
  ReviewSortField,
  UpdateReviewInput,
} from './reviews.validators';

/** Only the public part of the author is shown next to a review. */
const AUTHOR_FIELDS = 'username';

/** `'-rating'` -> `{ rating: -1, _id: -1 }`. `_id` keeps pagination order stable. */
export function buildReviewSort(sort: ReviewSortField): Record<string, 1 | -1> {
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');
  return { [field]: direction, _id: direction };
}

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;

async function findReviewOrThrow(id: string): Promise<ReviewDocument> {
  const review = await ReviewModel.findById(id);
  if (!review) throw AppError.notFound('Review');
  return review;
}

const isAuthor = (review: ReviewDocument, actor: AuthUser) => String(review.user) === actor.id;

async function ensureMovieExists(movieId: string): Promise<void> {
  if (!(await MovieModel.exists({ _id: movieId }))) throw AppError.notFound('Movie');
}

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
  async listForMovie(movieId: string, query: ListReviewsQuery): Promise<Paginated<ReviewDocument>> {
    await ensureMovieExists(movieId);
    const { page, limit } = query;
    const filter = { movie: movieId };

    const [data, total] = await Promise.all([
      ReviewModel.find(filter)
        .sort(buildReviewSort(query.sort))
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', AUTHOR_FIELDS),
      ReviewModel.countDocuments(filter),
    ]);

    return buildPaginated(data, total, page, limit);
  },

  async getById(id: string): Promise<ReviewDocument> {
    const review = await ReviewModel.findById(id).populate('user', AUTHOR_FIELDS);
    if (!review) throw AppError.notFound('Review');
    return review;
  },

  async create(movieId: string, input: CreateReviewInput, userId: string): Promise<ReviewDocument> {
    await ensureMovieExists(movieId);

    let review: ReviewDocument;
    try {
      review = await ReviewModel.create({ ...input, movie: movieId, user: userId });
    } catch (err) {
      // Rely on the unique (movie, user) index rather than a "find first" check, so two
      // simultaneous requests from the same user can't both get through.
      if (isDuplicateKeyError(err)) throw AppError.conflict('You have already reviewed this movie');
      throw err;
    }

    await this.recalculateMovieStats(movieId);
    return review.populate('user', AUTHOR_FIELDS);
  },

  /** Author only: not even an admin may put words in someone else's review. */
  async update(id: string, input: UpdateReviewInput, actor: AuthUser): Promise<ReviewDocument> {
    const review = await findReviewOrThrow(id);
    if (!isAuthor(review, actor)) throw AppError.forbidden('You can only edit your own review');

    review.set(input);
    await review.save();
    // Only the rating affects the movie stats.
    if (input.rating !== undefined) await this.recalculateMovieStats(String(review.movie));
    return review.populate('user', AUTHOR_FIELDS);
  },

  /** The author, or an admin moderating content. */
  async remove(id: string, actor: AuthUser): Promise<void> {
    const review = await findReviewOrThrow(id);
    if (!isAuthor(review, actor) && actor.role !== 'admin') {
      throw AppError.forbidden('You can only delete your own review');
    }

    await review.deleteOne();
    await this.recalculateMovieStats(String(review.movie));
  },

  /**
   * Recomputes ratingAverage + reviewCount from all of the movie's reviews and stores them
   * on the movie. Recomputing from scratch (instead of adjusting by +/- one rating) means
   * the stats can never drift, whatever happened before.
   */
  async recalculateMovieStats(movieId: string): Promise<void> {
    const reviews = await ReviewModel.find({ movie: movieId }, { rating: 1, _id: 0 }).lean();
    const stats = calculateRatingStats(reviews.map((r) => r.rating));
    await MovieModel.updateOne({ _id: movieId }, { $set: stats });
  },
};
