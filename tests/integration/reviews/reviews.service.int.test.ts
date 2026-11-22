import { Types } from 'mongoose';
import { reviewsService } from '../../../src/modules/reviews/reviews.service';
import { listReviewsQuery } from '../../../src/modules/reviews/reviews.validators';
import { createUser } from '../../helpers/auth';
import { createMovie, createReview } from '../../helpers/factories';

const list = (movieId: string, raw: Record<string, string> = {}) =>
  reviewsService.listForMovie(movieId, listReviewsQuery.parse(raw));

describe('reviewsService (integration)', () => {
  describe('getById', () => {
    it('returns the review with the author username', async () => {
      const movie = await createMovie();
      const { user } = await createUser({ username: 'critic' });
      const created = await createReview({ movie: movie._id, user: user._id, rating: 9 });

      const review = await reviewsService.getById(created.id);

      expect(review.toJSON()).toMatchObject({
        id: created.id,
        rating: 9,
        movie: movie._id,
        user: { id: user.id, username: 'critic' },
      });
    });

    it('does not expose the author email or password', async () => {
      const movie = await createMovie();
      const { user } = await createUser();
      const created = await createReview({ movie: movie._id, user: user._id });

      const json = (await reviewsService.getById(created.id)).toJSON() as Record<string, unknown>;

      expect(Object.keys(json.user as object).sort()).toEqual(['id', 'username']);
    });

    it('throws 404 when the review does not exist', async () => {
      await expect(
        reviewsService.getById(new Types.ObjectId().toString()),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('listForMovie', () => {
    it('returns only the reviews of that movie, newest first by default', async () => {
      const movie = await createMovie();
      const other = await createMovie();
      const { user: u1 } = await createUser();
      const { user: u2 } = await createUser();
      const first = await createReview({ movie: movie._id, user: u1._id });
      const second = await createReview({ movie: movie._id, user: u2._id });
      await createReview({ movie: other._id, user: u1._id });

      const result = await list(movie.id);

      expect(result.data.map((r) => r.id)).toEqual([second.id, first.id]);
      expect(result.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
    });

    it('sorts by rating', async () => {
      const movie = await createMovie();
      const ratings = [5, 9, 7];
      for (const rating of ratings) {
        const { user } = await createUser();
        await createReview({ movie: movie._id, user: user._id, rating });
      }

      expect((await list(movie.id, { sort: 'rating' })).data.map((r) => r.rating)).toEqual([
        5, 7, 9,
      ]);
      expect((await list(movie.id, { sort: '-rating' })).data.map((r) => r.rating)).toEqual([
        9, 7, 5,
      ]);
    });

    it('paginates', async () => {
      const movie = await createMovie();
      for (let i = 0; i < 5; i += 1) {
        const { user } = await createUser();
        await createReview({ movie: movie._id, user: user._id });
      }

      const page2 = await list(movie.id, { page: '2', limit: '2' });

      expect(page2.data).toHaveLength(2);
      expect(page2.pagination).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
    });

    it('populates the author username', async () => {
      const movie = await createMovie();
      const { user } = await createUser({ username: 'reviewer1' });
      await createReview({ movie: movie._id, user: user._id });

      const [review] = (await list(movie.id)).data;

      expect(review.toJSON().user).toEqual({ id: user.id, username: 'reviewer1' });
    });

    it('returns an empty page for a movie without reviews', async () => {
      const movie = await createMovie();

      const result = await list(movie.id);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('throws 404 when the movie does not exist', async () => {
      await expect(list(new Types.ObjectId().toString())).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  it.todo('create updates ratingAverage and reviewCount on the movie');
  it.todo('update of a rating updates ratingAverage on the movie');
  it.todo('remove updates ratingAverage and reviewCount on the movie');
  it.todo('the same user cannot review the same movie twice (409)');
  it.todo('two different users can review the same movie');
});
