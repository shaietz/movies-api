import { UserModel } from '../../../src/modules/users/user.model';
import { verifyToken } from '../../../src/shared/utils/jwt';
import { api, bearer } from '../../helpers/request';
import { createUser, tokenFor } from '../../helpers/auth';

const registerBody = { username: 'moviefan_1', email: 'fan@example.com', password: 'Secret123!' };

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('rejects an invalid body with 400', async () => {
      const res = await api().post('/api/auth/register').send({ email: 'not-an-email' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('registers a user and returns 201 with a token and no password', async () => {
      const res = await api().post('/api/auth/register').send(registerBody);

      expect(res.status).toBe(201);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.user).toMatchObject({
        id: expect.any(String),
        username: 'moviefan_1',
        email: 'fan@example.com',
        role: 'user',
      });
      expect(res.body.user).not.toHaveProperty('password');
      expect(verifyToken(res.body.token).id).toBe(res.body.user.id);
    });

    it('ignores a "role": "admin" field in the body', async () => {
      const res = await api()
        .post('/api/auth/register')
        .send({ ...registerBody, role: 'admin' });

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('user');
      expect((await UserModel.findById(res.body.user.id))!.role).toBe('user');
    });

    it('returns 409 for a duplicate email', async () => {
      await createUser({ email: registerBody.email });
      const res = await api().post('/api/auth/register').send(registerBody);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('POST /api/auth/login', () => {
    it('returns 200 and a token for valid credentials', async () => {
      const { user, password } = await createUser({ email: 'fan@example.com' });
      const res = await api().post('/api/auth/login').send({ email: 'FAN@example.com', password });

      expect(res.status).toBe(200);
      expect(verifyToken(res.body.token)).toEqual({ id: user.id, role: 'user' });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 401 for a wrong password', async () => {
      await createUser({ email: 'fan@example.com' });
      const res = await api()
        .post('/api/auth/login')
        .send({ email: 'fan@example.com', password: 'wrong-password' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without a token', async () => {
      expect((await api().get('/api/auth/me')).status).toBe(401);
    });

    it('returns 401 with an invalid token', async () => {
      expect((await api().get('/api/auth/me').set(bearer('nope'))).status).toBe(401);
    });

    it('returns the current user for a valid token', async () => {
      const { user, token } = await createUser();
      const res = await api().get('/api/auth/me').set(bearer(token));

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ id: user.id, username: user.username });
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('returns 404 if the token belongs to a deleted user', async () => {
      const res = await api()
        .get('/api/auth/me')
        .set(bearer(tokenFor('user')));
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  it('a valid token gets past the auth middleware', async () => {
    const res = await api()
      .get('/api/auth/me')
      .set(bearer(tokenFor('user')));
    expect(res.status).not.toBe(401);
  });
});
