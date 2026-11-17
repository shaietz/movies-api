import { api } from '../helpers/request';

describe('App (api)', () => {
  it('GET /api/health returns ok', async () => {
    const res = await api().get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('unknown routes return a 404 in the standard error format', async () => {
    const res = await api().get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('malformed JSON returns 400', async () => {
    const res = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
  });

  it('serves the OpenAPI spec with every module documented', async () => {
    const res = await api().get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(Object.keys(res.body.paths)).toEqual(
      expect.arrayContaining([
        '/auth/register',
        '/auth/login',
        '/users',
        '/movies',
        '/movies/{id}',
        '/movies/{movieId}/reviews',
        '/reviews/{id}',
      ]),
    );
  });
});
