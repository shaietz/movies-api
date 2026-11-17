import { Types } from 'mongoose';
import { tokenFor } from '../../helpers/auth';
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

  it.todo('GET /api/users lists users without passwords');
  it.todo('PATCH /api/users/:id/role promotes a user to admin');
  it.todo('DELETE /api/users/:id returns 204 and removes the user');
  it.todo('an admin cannot delete or demote themselves (400)');
});
