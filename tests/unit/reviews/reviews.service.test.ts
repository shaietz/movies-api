import { buildReviewSort } from '../../../src/modules/reviews/reviews.service';

/**
 * Unit tests: business rules only, with models mocked, e.g.
 *   jest.mock('../../../src/modules/reviews/review.model');
 *   jest.mock('../../../src/modules/movies/movie.model');
 */
describe('reviewsService (unit)', () => {
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
    it.todo('throws 404 when the review does not exist');
    it.todo('throws 403 when the actor is not the author (even if admin)');
    it.todo('recalculates the movie stats after a successful update');
  });

  describe('remove', () => {
    it.todo('allows the author');
    it.todo('allows an admin');
    it.todo('throws 403 for another regular user');
    it.todo('recalculates the movie stats after deleting');
  });
});
