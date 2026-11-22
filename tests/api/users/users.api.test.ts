import { Types } from 'mongoose';
import { reviewsService } from '../../../src/modules/reviews/reviews.service';
import { createAdmin, createUser, tokenFor } from '../../helpers/auth';
import { api, bearer } from '../../helpers/request';

describe('Users API (admin only)', () => {
  const someId = new Types.ObjectId().toString();

  it.each([
    ['GET', '/api/users'],
    ['GET', `/api/users/${someId}`],
    ['PATCH', `/api/users/${someId}/role`],
    ['DELETE', `/api/users/${someId}`],
  ])('%s %s -> 401 without a token, 403 for a regular user', async (method, url) => {
    const methods = {
      GET: () => api().get(url),
      PATCH: () => api().patch(url),
      DELETE: () => api().delete(url),
    };
    const send = (headers: Record<string, string> = {}) =>
      methods[method as keyof typeof methods]().set(headers);
    expect((await send()).status).toBe(401);
    expect((await send(bearer(tokenFor('user')))).status).toBe(403);
  });

  it('PATCH /api/users/:id/role validates the role', async () => {
    const res = await api()
      .patch(`/api/users/${someId}/role`)
      .set(bearer(tokenFor('admin')))
      .send({ role: 'superuser' });
    expect(res.status).toBe(400);
  });

  it('GET /api/users lists users without passwords', async () => {
    const { token } = await createAdmin();
    await createUser();

    const res = await api().get('/api/users').set(bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 20, total: 2 });
    for (const u of res.body.data) {
      expect(u).not.toHaveProperty('password');
      expect(u).toHaveProperty('id');
    }
  });

  it('GET /api/users/:id returns 404 for an unknown user', async () => {
    const { token } = await createAdmin();
    const res = await api().get(`/api/users/${someId}`).set(bearer(token));
    expect(res.status).toBe(404);
  });

  it('PATCH /api/users/:id/role promotes a user to admin', async () => {
    const { token } = await createAdmin();
    const { user } = await createUser();

    const res = await api()
      .patch(`/api/users/${user.id}/role`)
      .set(bearer(token))
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: user.id, role: 'admin' });
  });

  it('DELETE /api/users/:id returns 204 and removes the user', async () => {
    const recalc = jest.spyOn(reviewsService, 'recalculateMovieStats').mockResolvedValue();
    const { token } = await createAdmin();
    const { user } = await createUser();

    const res = await api().delete(`/api/users/${user.id}`).set(bearer(token));
    expect(res.status).toBe(204);

    const after = await api().get(`/api/users/${user.id}`).set(bearer(token));
    expect(after.status).toBe(404);
    recalc.mockRestore();
  });

  it('an admin cannot delete or demote themselves (400)', async () => {
    const { user: admin, token } = await createAdmin();

    const del = await api().delete(`/api/users/${admin.id}`).set(bearer(token));
    expect(del.status).toBe(400);

    const demote = await api()
      .patch(`/api/users/${admin.id}/role`)
      .set(bearer(token))
      .send({ role: 'user' });
    expect(demote.status).toBe(400);
  });
});
