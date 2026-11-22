import { Types } from 'mongoose';
import { createUser, tokenFor } from '../../helpers/auth';
import { createMovie, createReview } from '../../helpers/factories';
import { api, bearer } from '../../helpers/request';

describe('Reviews API', () => {
  const movieId = new Types.ObjectId().toString();
  const reviewId = new Types.ObjectId().toString();

  describe('access rules (already enforced by the routes)', () => {
    it('POST /api/movies/:movieId/reviews -> 401 without a token', async () => {
      const res = await api().post(`/api/movies/${movieId}/reviews`).send({ rating: 8 });
      expect(res.status).toBe(401);
    });

    it.each([0, 11, 7.5, '8'])('rating %p -> 400', async (rating) => {
      const res = await api()
        .post(`/api/movies/${movieId}/reviews`)
        .set(bearer(tokenFor('user')))
        .send({ rating });
      expect(res.status).toBe(400);
    });

    it('PATCH and DELETE /api/reviews/:id -> 401 without a token', async () => {
      expect((await api().patch(`/api/reviews/${reviewId}`).send({ rating: 5 })).status).toBe(401);
      expect((await api().delete(`/api/reviews/${reviewId}`)).status).toBe(401);
    });
  });

  describe('reading (public)', () => {
    it('GET /api/movies/:movieId/reviews is public, paginated, and shows usernames', async () => {
      const movie = await createMovie();
      const { user: alice } = await createUser({ username: 'alice' });
      const { user: bob } = await createUser({ username: 'bob' });
      await createReview({ movie: movie._id, user: alice._id, rating: 6 });
      await createReview({ movie: movie._id, user: bob._id, rating: 9 });

      const res = await api().get(`/api/movies/${movie.id}/reviews?sort=-rating&limit=1`);

      expect(res.status).toBe(200);
      expect(res.body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        rating: 9,
        movie: movie.id,
        user: { id: bob.id, username: 'bob' },
      });
      expect(res.body.data[0].user.email).toBeUndefined();
    });

    it('GET /api/movies/:movieId/reviews -> 404 for a missing movie', async () => {
      expect((await api().get(`/api/movies/${movieId}/reviews`)).status).toBe(404);
    });

    it('GET /api/movies/:movieId/reviews -> 400 for an unknown sort field', async () => {
      const movie = await createMovie();
      expect((await api().get(`/api/movies/${movie.id}/reviews?sort=user`)).status).toBe(400);
    });

    it('GET /api/reviews/:id -> 200 with the review', async () => {
      const movie = await createMovie();
      const { user } = await createUser({ username: 'carol' });
      const review = await createReview({ movie: movie._id, user: user._id, text: 'Loved it' });

      const res = await api().get(`/api/reviews/${review.id}`);

      expect(res.status).toBe(200);
      expect(res.body.review).toMatchObject({
        id: review.id,
        text: 'Loved it',
        user: { id: user.id, username: 'carol' },
      });
    });

    it('GET /api/reviews/:id -> 404 for a missing review, 400 for a malformed id', async () => {
      expect((await api().get(`/api/reviews/${reviewId}`)).status).toBe(404);
      expect((await api().get('/api/reviews/not-an-id')).status).toBe(400);
    });
  });

  describe('creating', () => {
    it('POST -> 201, and the movie now shows reviewCount 1 and the rating as average', async () => {
      const movie = await createMovie();
      const { user, token } = await createUser({ username: 'dana' });

      const res = await api()
        .post(`/api/movies/${movie.id}/reviews`)
        .set(bearer(token))
        .send({ rating: 8, text: '  Really good  ' });

      expect(res.status).toBe(201);
      expect(res.body.review).toMatchObject({
        rating: 8,
        text: 'Really good',
        movie: movie.id,
        user: { id: user.id, username: 'dana' },
      });

      const details = await api().get(`/api/movies/${movie.id}`);
      expect(details.body.movie).toMatchObject({ reviewCount: 1, ratingAverage: 8 });
    });

    it('POST without text -> 201 with empty text', async () => {
      const movie = await createMovie();
      const { token } = await createUser();

      const res = await api()
        .post(`/api/movies/${movie.id}/reviews`)
        .set(bearer(token))
        .send({ rating: 3 });

      expect(res.status).toBe(201);
      expect(res.body.review.text).toBe('');
    });

    it('POST twice by the same user -> 409', async () => {
      const movie = await createMovie();
      const { token } = await createUser();
      const post = () =>
        api().post(`/api/movies/${movie.id}/reviews`).set(bearer(token)).send({ rating: 7 });

      expect((await post()).status).toBe(201);
      expect((await post()).status).toBe(409);
    });

    it('POST for a missing movie -> 404', async () => {
      const { token } = await createUser();
      const res = await api()
        .post(`/api/movies/${movieId}/reviews`)
        .set(bearer(token))
        .send({ rating: 7 });
      expect(res.status).toBe(404);
    });

    it('POST with unknown fields (e.g. user or movie) -> 400', async () => {
      const movie = await createMovie();
      const { token } = await createUser();
      const res = await api()
        .post(`/api/movies/${movie.id}/reviews`)
        .set(bearer(token))
        .send({ rating: 7, user: new Types.ObjectId().toString() });
      expect(res.status).toBe(400);
    });
  });

  describe('features', () => {
    it.todo('PATCH by the author -> 200 and the movie average changes');
    it.todo('PATCH by another user -> 403');
    it.todo('DELETE by the author -> 204');
    it.todo('DELETE by an admin -> 204');
    it.todo('DELETE by another regular user -> 403');
  });
});
