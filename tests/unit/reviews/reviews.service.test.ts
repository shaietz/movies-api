import { Types } from 'mongoose';
import { ReviewModel } from '../../../src/modules/reviews/review.model';
import { buildReviewSort, reviewsService } from '../../../src/modules/reviews/reviews.service';
import type { AuthUser } from '../../../src/shared/types/express';

jest.mock('../../../src/modules/reviews/review.model');
jest.mock('../../../src/modules/movies/movie.model');

const reviewModel = jest.mocked(ReviewModel);

const authorId = new Types.ObjectId();
const movieId = new Types.ObjectId();
const reviewId = new Types.ObjectId().toString();

const author: AuthUser = { id: authorId.toString(), role: 'user' };
const otherUser: AuthUser = { id: new Types.ObjectId().toString(), role: 'user' };
const admin: AuthUser = { id: new Types.ObjectId().toString(), role: 'admin' };

/** Minimal stand-in for a review document written by `author`. */
function fakeReview() {
  const doc = {
    _id: new Types.ObjectId(reviewId),
    movie: movieId,
    user: authorId,
    rating: 5,
    text: 'ok',
    set: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
    deleteOne: jest.fn().mockResolvedValue(undefined),
    populate: jest.fn(),
  };
  doc.populate.mockResolvedValue(doc);
  return doc;
}

describe('reviewsService (unit)', () => {
  let recalculate: jest.SpyInstance;

  beforeEach(() => {
    recalculate = jest.spyOn(reviewsService, 'recalculateMovieStats').mockResolvedValue();
  });

  afterEach(() => recalculate.mockRestore());

  describe('buildReviewSort', () => {
    it('sorts descending with a "-" prefix and adds an _id tie-breaker', () => {
      expect(buildReviewSort('-createdAt')).toEqual({ createdAt: -1, _id: -1 });
      expect(buildReviewSort('-rating')).toEqual({ rating: -1, _id: -1 });
    });

    it('sorts ascending without a prefix', () => {
      expect(buildReviewSort('rating')).toEqual({ rating: 1, _id: 1 });
    });
  });

  describe('update', () => {
    it('throws 404 when the review does not exist', async () => {
      reviewModel.findById.mockResolvedValue(null as never);

      await expect(reviewsService.update(reviewId, { rating: 9 }, author)).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(recalculate).not.toHaveBeenCalled();
    });

    it.each([
      ['another user', otherUser],
      ['an admin', admin],
    ])('throws 403 when the actor is %s, not the author', async (_label, actor) => {
      const review = fakeReview();
      reviewModel.findById.mockResolvedValue(review as never);

      await expect(reviewsService.update(reviewId, { rating: 9 }, actor)).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(review.save).not.toHaveBeenCalled();
      expect(recalculate).not.toHaveBeenCalled();
    });

    it('applies the changes and recalculates the movie stats after a successful update', async () => {
      const review = fakeReview();
      reviewModel.findById.mockResolvedValue(review as never);

      const result = await reviewsService.update(reviewId, { rating: 9 }, author);

      expect(review.set).toHaveBeenCalledWith({ rating: 9 });
      expect(review.save).toHaveBeenCalled();
      expect(recalculate).toHaveBeenCalledWith(movieId.toString());
      expect(result).toBe(review);
    });

    it('does not recalculate the stats when only the text changes', async () => {
      const review = fakeReview();
      reviewModel.findById.mockResolvedValue(review as never);

      await reviewsService.update(reviewId, { text: 'better now' }, author);

      expect(review.save).toHaveBeenCalled();
      expect(recalculate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws 404 when the review does not exist', async () => {
      reviewModel.findById.mockResolvedValue(null as never);

      await expect(reviewsService.remove(reviewId, author)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it.each([
      ['the author', author],
      ['an admin', admin],
    ])('allows %s and recalculates the movie stats after deleting', async (_label, actor) => {
      const review = fakeReview();
      reviewModel.findById.mockResolvedValue(review as never);

      await reviewsService.remove(reviewId, actor);

      expect(review.deleteOne).toHaveBeenCalled();
      expect(recalculate).toHaveBeenCalledWith(movieId.toString());
    });

    it('throws 403 for another regular user', async () => {
      const review = fakeReview();
      reviewModel.findById.mockResolvedValue(review as never);

      await expect(reviewsService.remove(reviewId, otherUser)).rejects.toMatchObject({
        statusCode: 403,
      });
      expect(review.deleteOne).not.toHaveBeenCalled();
      expect(recalculate).not.toHaveBeenCalled();
    });
  });
});
