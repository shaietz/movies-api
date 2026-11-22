import { Types } from 'mongoose';
import { tokenFor } from '../../helpers/auth';
import { MovieModel } from '../../../src/modules/movies/movie.model';
import { ReviewModel } from '../../../src/modules/reviews/review.model';
import { createMovie, createReview, movieInput } from '../../helpers/factories';
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
    const adminId = new Types.ObjectId().toString();
    const admin = () => bearer(tokenFor('admin', adminId));

    it('POST /api/movies as admin -> 201, with createdBy, ratingAverage 0 and reviewCount 0', async () => {
      const input = movieInput({ title: 'Inception' });
      const res = await api().post('/api/movies').set(admin()).send(input);

      expect(res.status).toBe(201);
      expect(res.body.movie).toMatchObject({
        ...input,
        createdBy: adminId,
        ratingAverage: 0,
        reviewCount: 0,
      });
      expect(res.body.movie.id).toEqual(expect.any(String));
      expect(res.body.movie).not.toHaveProperty('_id');
    });

    it('POST /api/movies duplicate title + year -> 409', async () => {
      await createMovie({ title: 'Inception', releaseYear: 2010 });
      const res = await api()
        .post('/api/movies')
        .set(admin())
        .send(movieInput({ title: 'INCEPTION', releaseYear: 2010 }));

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('GET /api/movies is public and paginated', async () => {
      for (let i = 0; i < 3; i += 1) await createMovie();
      const res = await api().get('/api/movies?limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2 });
    });

    it('GET /api/movies?q=incep finds "Inception"', async () => {
      await createMovie({ title: 'Inception' });
      await createMovie({ title: 'Memento' });
      const res = await api().get('/api/movies?q=incep');

      expect(res.status).toBe(200);
      expect(res.body.data.map((m: { title: string }) => m.title)).toEqual(['Inception']);
    });

    it('GET /api/movies?genre=drama&yearFrom=2000&sort=-ratingAverage', async () => {
      const seed = [
        { title: 'Good Drama', genres: ['drama'], releaseYear: 2005, rating: 7 },
        { title: 'Best Drama', genres: ['drama'], releaseYear: 2015, rating: 9 },
        { title: 'Old Drama', genres: ['drama'], releaseYear: 1990, rating: 10 },
        { title: 'Comedy', genres: ['comedy'], releaseYear: 2010, rating: 8 },
      ] as const;
      for (const { rating, genres, ...rest } of seed) {
        const movie = await createMovie({ ...rest, genres: [...genres] });
        await MovieModel.updateOne({ _id: movie._id }, { ratingAverage: rating });
      }

      const res = await api().get('/api/movies?genre=drama&yearFrom=2000&sort=-ratingAverage');

      expect(res.status).toBe(200);
      expect(res.body.data.map((m: { title: string }) => m.title)).toEqual([
        'Best Drama',
        'Good Drama',
      ]);
    });

    it('GET /api/movies ignores case in genre and sort', async () => {
      await createMovie({ title: 'Drama One', genres: ['drama'] });
      await createMovie({ title: 'Comedy One', genres: ['comedy'] });
      const res = await api().get('/api/movies?genre=Drama&sort=-RatingAverage');

      expect(res.status).toBe(200);
      expect(res.body.data.map((m: { title: string }) => m.title)).toEqual(['Drama One']);
    });

    it('GET /api/movies/:id returns ratingAverage and reviewCount', async () => {
      const movie = await createMovie();
      await MovieModel.updateOne({ _id: movie._id }, { ratingAverage: 8.5, reviewCount: 2 });
      const res = await api().get(`/api/movies/${movie.id}`);

      expect(res.status).toBe(200);
      expect(res.body.movie).toMatchObject({ id: movie.id, ratingAverage: 8.5, reviewCount: 2 });
    });

    it('GET /api/movies/:id -> 404 for a missing movie', async () => {
      const res = await api().get(`/api/movies/${someId}`);
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('PATCH /api/movies/:id as admin updates only the sent fields', async () => {
      const movie = await createMovie({ title: 'Old Title', director: 'Kept Director' });
      const res = await api()
        .patch(`/api/movies/${movie.id}`)
        .set(admin())
        .send({ title: 'New Title' });

      expect(res.status).toBe(200);
      expect(res.body.movie).toMatchObject({ title: 'New Title', director: 'Kept Director' });
      const stored = await MovieModel.findById(movie._id);
      expect(stored?.title).toBe('New Title');
      expect(stored?.director).toBe('Kept Director');
      expect(stored?.actors).toEqual(movie.actors);
    });

    it('PATCH /api/movies/:id -> 404 for a missing movie', async () => {
      const res = await api().patch(`/api/movies/${someId}`).set(admin()).send({ title: 'X' });
      expect(res.status).toBe(404);
    });

    it('DELETE /api/movies/:id as admin -> 204 and its reviews are gone', async () => {
      const movie = await createMovie();
      await createReview({ movie: movie._id, user: new Types.ObjectId() });

      const res = await api().delete(`/api/movies/${movie.id}`).set(admin());

      expect(res.status).toBe(204);
      expect((await api().get(`/api/movies/${movie.id}`)).status).toBe(404);
      expect(await ReviewModel.countDocuments({ movie: movie._id })).toBe(0);
    });

    it('DELETE /api/movies/:id -> 404 for a missing movie', async () => {
      expect((await api().delete(`/api/movies/${someId}`).set(admin())).status).toBe(404);
    });
  });
});
