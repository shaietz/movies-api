import { MovieModel } from '../../../src/modules/movies/movie.model';
import {
  buildMovieFilter,
  buildMovieSort,
  moviesService,
} from '../../../src/modules/movies/movies.service';
import { searchMoviesQuery } from '../../../src/modules/movies/movies.validators';
import { ReviewModel } from '../../../src/modules/reviews/review.model';
import { AppError } from '../../../src/shared/errors/AppError';

jest.mock('../../../src/modules/movies/movie.model');
jest.mock('../../../src/modules/reviews/review.model');

const movieModel = jest.mocked(MovieModel);
const reviewModel = jest.mocked(ReviewModel);

/** Parses like the route does, so defaults (page, limit, sort) are filled in. */
const query = (raw: Record<string, string> = {}) => searchMoviesQuery.parse(raw);

/** Chainable stand-in for a Mongoose query that resolves to `result`. */
function queryChain<T>(result: T) {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    collation: jest.fn().mockReturnThis(),
    then: (resolve: (v: T) => unknown, reject: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

describe('moviesService (unit)', () => {
  describe('search', () => {
    it('builds a case-insensitive partial-match filter from q', () => {
      expect(buildMovieFilter(query({ q: 'incep' }))).toEqual({
        title: { $regex: 'incep', $options: 'i' },
      });
    });

    it('escapes regex special characters in text filters', () => {
      expect(buildMovieFilter(query({ q: 'a.b(', actor: 'x*' }))).toEqual({
        title: { $regex: 'a\\.b\\(', $options: 'i' },
        actors: { $regex: 'x\\*', $options: 'i' },
      });
    });

    it('builds a year range filter from yearFrom/yearTo', () => {
      expect(buildMovieFilter(query({ yearFrom: '2000', yearTo: '2010' }))).toEqual({
        releaseYear: { $gte: 2000, $lte: 2010 },
      });
      expect(buildMovieFilter(query({ yearTo: '1999' }))).toEqual({
        releaseYear: { $lte: 1999 },
      });
    });

    it('filters by genre and director', () => {
      expect(buildMovieFilter(query({ genre: 'drama', director: 'nolan' }))).toEqual({
        genres: 'drama',
        director: { $regex: 'nolan', $options: 'i' },
      });
    });

    it('filters by minRating on ratingAverage', () => {
      expect(buildMovieFilter(query({ minRating: '7.5' }))).toEqual({
        ratingAverage: { $gte: 7.5 },
      });
    });

    it('builds the sort with an _id tie-breaker', () => {
      expect(buildMovieSort('-ratingAverage')).toEqual({ ratingAverage: -1, _id: -1 });
      expect(buildMovieSort('title')).toEqual({ title: 1, _id: 1 });
    });

    it('applies sort, skip and limit from the query', async () => {
      const docs = [{ title: 'A' }];
      const chain = queryChain(docs);
      movieModel.find.mockReturnValue(chain as never);
      movieModel.countDocuments.mockResolvedValue(7 as never);

      const result = await moviesService.search(
        query({ page: '2', limit: '3', sort: 'releaseYear', genre: 'drama' }),
      );

      expect(movieModel.find).toHaveBeenCalledWith({ genres: 'drama' });
      expect(movieModel.countDocuments).toHaveBeenCalledWith({ genres: 'drama' });
      expect(chain.sort).toHaveBeenCalledWith({ releaseYear: 1, _id: 1 });
      expect(chain.skip).toHaveBeenCalledWith(3);
      expect(chain.limit).toHaveBeenCalledWith(3);
      expect(result).toEqual({
        data: docs,
        pagination: { page: 2, limit: 3, total: 7, totalPages: 3 },
      });
    });
  });

  describe('getById', () => {
    it('throws 404 when the movie does not exist', async () => {
      movieModel.findById.mockResolvedValue(null as never);
      await expect(moviesService.getById('id')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('create', () => {
    it('stores createdBy = the admin id', async () => {
      movieModel.create.mockResolvedValue({ id: 'm1' } as never);
      const input = {
        title: 'X',
        releaseYear: 2000,
        genres: ['drama' as const],
        director: 'D',
        actors: [],
        description: '',
      };

      await moviesService.create(input, 'admin-1');

      expect(movieModel.create).toHaveBeenCalledWith({ ...input, createdBy: 'admin-1' });
    });
  });

  describe('update', () => {
    it('throws 404 when the movie does not exist', async () => {
      movieModel.findById.mockResolvedValue(null as never);
      await expect(moviesService.update('id', { title: 'New' })).rejects.toBeInstanceOf(AppError);
    });

    it('sets only the given fields and saves', async () => {
      const doc = { set: jest.fn(), save: jest.fn().mockResolvedValue(undefined) };
      movieModel.findById.mockResolvedValue(doc as never);

      const result = await moviesService.update('id', { title: 'New' });

      expect(doc.set).toHaveBeenCalledWith({ title: 'New' });
      expect(doc.save).toHaveBeenCalled();
      expect(result).toBe(doc);
    });
  });

  describe('remove', () => {
    it('throws 404 when the movie does not exist', async () => {
      movieModel.findByIdAndDelete.mockResolvedValue(null as never);

      await expect(moviesService.remove('id')).rejects.toMatchObject({ statusCode: 404 });
      expect(reviewModel.deleteMany).not.toHaveBeenCalled();
    });

    it('deletes the reviews of the movie', async () => {
      movieModel.findByIdAndDelete.mockResolvedValue({ _id: 'm1' } as never);
      reviewModel.deleteMany.mockResolvedValue({} as never);

      await moviesService.remove('m1');

      expect(reviewModel.deleteMany).toHaveBeenCalledWith({ movie: 'm1' });
    });
  });
});
