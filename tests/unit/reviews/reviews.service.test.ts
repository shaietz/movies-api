/**
 * Unit tests: business rules only, with models mocked, e.g.
 *   jest.mock('../../../src/modules/reviews/review.model');
 *   jest.mock('../../../src/modules/movies/movie.model');
 */
describe('reviewsService (unit)', () => {
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
