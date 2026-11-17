import { Types } from 'mongoose';
import { tokenFor } from '../../helpers/auth';
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

  describe('features', () => {
    it.todo('POST -> 201, and the movie now shows reviewCount 1 and the rating as average');
    it.todo('POST twice by the same user -> 409');
    it.todo('POST for a missing movie -> 404');
    it.todo('GET /api/movies/:movieId/reviews is public, paginated, and shows usernames');
    it.todo('PATCH by the author -> 200 and the movie average changes');
    it.todo('PATCH by another user -> 403');
    it.todo('DELETE by the author -> 204');
    it.todo('DELETE by an admin -> 204');
    it.todo('DELETE by another regular user -> 403');
  });
});
