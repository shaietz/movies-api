import { createMovie } from '../../helpers/factories';

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
  it.todo('search by q matches part of the title, case-insensitively');
  it.todo('search by genre, director and actor');
  it.todo('search by yearFrom/yearTo range');
  it.todo('search sorted by -ratingAverage');
  it.todo('remove also deletes the reviews of the movie');
});
