import { Types } from 'mongoose';
import { tokenFor } from '../../helpers/auth';
import { movieInput } from '../../helpers/factories';
import { api, bearer } from '../../helpers/request';

describe('Movies API', () => {
  const someId = new Types.ObjectId().toString();

  describe('access rules (already enforced by the routes)', () => {
    it('POST /api/movies -> 401 without a token', async () => {
      expect((await api().post('/api/movies').send(movieInput())).status).toBe(401);
    });

    it('POST /api/movies -> 403 for a regular user', async () => {
      const res = await api()
        .post('/api/movies')
        .set(bearer(tokenFor('user')))
        .send(movieInput());
      expect(res.status).toBe(403);
    });

    it('PATCH and DELETE /api/movies/:id -> 403 for a regular user', async () => {
      const auth = bearer(tokenFor('user'));
      expect(
        (await api().patch(`/api/movies/${someId}`).set(auth).send({ title: 'X' })).status,
      ).toBe(403);
      expect((await api().delete(`/api/movies/${someId}`).set(auth)).status).toBe(403);
    });

    it('POST /api/movies -> 400 for an invalid body (admin)', async () => {
      const res = await api()
        .post('/api/movies')
        .set(bearer(tokenFor('admin')))
        .send({ title: '' });
      expect(res.status).toBe(400);
    });

    it('GET /api/movies/:id -> 400 for a malformed id', async () => {
      expect((await api().get('/api/movies/not-an-id')).status).toBe(400);
    });
  });

  describe('features', () => {
    it.todo('POST /api/movies as admin -> 201, with createdBy, ratingAverage 0 and reviewCount 0');
    it.todo('POST /api/movies duplicate title + year -> 409');
    it.todo('GET /api/movies is public and paginated');
    it.todo('GET /api/movies?q=incep finds "Inception"');
    it.todo('GET /api/movies?genre=drama&yearFrom=2000&sort=-ratingAverage');
    it.todo('GET /api/movies/:id returns ratingAverage and reviewCount');
    it.todo('GET /api/movies/:id -> 404 for a missing movie');
    it.todo('PATCH /api/movies/:id as admin updates only the sent fields');
    it.todo('DELETE /api/movies/:id as admin -> 204 and its reviews are gone');
  });
});
