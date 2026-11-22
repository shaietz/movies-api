import { Types } from 'mongoose';
import { MovieModel } from '../../../src/modules/movies/movie.model';
import { moviesService } from '../../../src/modules/movies/movies.service';
import { searchMoviesQuery } from '../../../src/modules/movies/movies.validators';
import { ReviewModel } from '../../../src/modules/reviews/review.model';
import { createMovie, createReview } from '../../helpers/factories';

/** Example integration test: checks a DB-level rule from the schema. */
describe('MovieModel (integration)', () => {
  it('starts with zero rating stats', async () => {
    const movie = await createMovie();
    expect(movie.ratingAverage).toBe(0);
    expect(movie.reviewCount).toBe(0);
  });

  it('rejects a second movie with the same title and year (case-insensitive)', async () => {
    await createMovie({ title: 'Inception', releaseYear: 2010 });
    await expect(createMovie({ title: 'inception', releaseYear: 2010 })).rejects.toMatchObject({
      code: 11000,
    });
  });
});

describe('moviesService (integration)', () => {
  const search = (raw: Record<string, string> = {}) =>
    moviesService.search(searchMoviesQuery.parse(raw));
  const titles = (result: Awaited<ReturnType<typeof search>>) => result.data.map((m) => m.title);

  it('search by q matches part of the title, case-insensitively', async () => {
    await createMovie({ title: 'Inception' });
    await createMovie({ title: 'Interstellar' });

    expect(titles(await search({ q: 'INCEP' }))).toEqual(['Inception']);
  });

  it('search by genre, director and actor', async () => {
    await createMovie({ title: 'A', genres: ['drama', 'war'], director: 'Christopher Nolan' });
    await createMovie({ title: 'B', genres: ['comedy'], actors: ['Tom Hanks', 'Meg Ryan'] });

    expect(titles(await search({ genre: 'war' }))).toEqual(['A']);
    expect(titles(await search({ director: 'nolan' }))).toEqual(['A']);
    expect(titles(await search({ actor: 'hanks' }))).toEqual(['B']);
  });

  it('search by yearFrom/yearTo range', async () => {
    await createMovie({ title: 'Old', releaseYear: 1999 });
    await createMovie({ title: 'Start', releaseYear: 2000 });
    await createMovie({ title: 'End', releaseYear: 2010 });
    await createMovie({ title: 'New', releaseYear: 2011 });

    const result = await search({ yearFrom: '2000', yearTo: '2010', sort: 'releaseYear' });
    expect(titles(result)).toEqual(['Start', 'End']);
  });

  it('search sorted by -ratingAverage', async () => {
    for (const [title, ratingAverage] of [
      ['Mid', 6.5],
      ['Top', 9.1],
      ['Low', 2],
    ] as const) {
      const movie = await createMovie({ title });
      await MovieModel.updateOne({ _id: movie._id }, { ratingAverage });
    }

    expect(titles(await search({ sort: '-ratingAverage' }))).toEqual(['Top', 'Mid', 'Low']);
    expect(titles(await search({ minRating: '6.5', sort: '-ratingAverage' }))).toEqual([
      'Top',
      'Mid',
    ]);
  });

  it('search paginates', async () => {
    for (const title of ['A', 'B', 'C']) await createMovie({ title });

    const result = await search({ sort: 'title', page: '2', limit: '2' });
    expect(titles(result)).toEqual(['C']);
    expect(result.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('remove also deletes the reviews of the movie', async () => {
    const doomed = await createMovie();
    const kept = await createMovie();
    const userA = new Types.ObjectId();
    const userB = new Types.ObjectId();
    await createReview({ movie: doomed._id, user: userA });
    await createReview({ movie: doomed._id, user: userB });
    await createReview({ movie: kept._id, user: userA });

    await moviesService.remove(doomed.id);

    expect(await MovieModel.findById(doomed._id)).toBeNull();
    expect(await ReviewModel.countDocuments({ movie: doomed._id })).toBe(0);
    expect(await ReviewModel.countDocuments({ movie: kept._id })).toBe(1);
  });
});
