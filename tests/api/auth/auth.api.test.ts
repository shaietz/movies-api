import { api, bearer } from '../../helpers/request';
import { tokenFor } from '../../helpers/auth';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('rejects an invalid body with 400', async () => {
      const res = await api().post('/api/auth/register').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it.todo('registers a user and returns 201 with a token and no password');
    it.todo('ignores a "role": "admin" field in the body');
    it.todo('returns 409 for a duplicate email');
  });

  describe('POST /api/auth/login', () => {
    it.todo('returns 200 and a token for valid credentials');
    it.todo('returns 401 for a wrong password');
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without a token', async () => {
      expect((await api().get('/api/auth/me')).status).toBe(401);
    });

    it('returns 401 with an invalid token', async () => {
      expect((await api().get('/api/auth/me').set(bearer('nope'))).status).toBe(401);
    });

    it.todo('returns the current user for a valid token');
    it.todo('returns 404 if the token belongs to a deleted user');
  });

  it('a valid token gets past the auth middleware', async () => {
    const res = await api()
      .get('/api/auth/me')
      .set(bearer(tokenFor('user')));
    expect(res.status).not.toBe(401);
  });
});
