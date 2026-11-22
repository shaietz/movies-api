import {
  createMovieSchema,
  searchMoviesQuery,
  updateMovieSchema,
} from '../../../src/modules/movies/movies.validators';
import { movieInput } from '../../helpers/factories';

describe('movies validators', () => {
  describe('createMovieSchema', () => {
    it('accepts a valid movie and fills defaults', () => {
      const { actors: _a, description: _d, ...minimal } = movieInput();
      const parsed = createMovieSchema.parse(minimal);
      expect(parsed.actors).toEqual([]);
      expect(parsed.description).toBe('');
    });

    it.each([
      ['missing title', { title: undefined }],
      ['empty genres', { genres: [] }],
      ['unknown genre', { genres: ['opera'] }],
      ['year before cinema existed', { releaseYear: 1700 }],
    ])('rejects %s', (_label, override) => {
      expect(createMovieSchema.safeParse({ ...movieInput(), ...override }).success).toBe(false);
    });

    it('accepts genres in any case and stores them lowercase', () => {
      const parsed = createMovieSchema.parse({ ...movieInput(), genres: ['Drama', ' SCI-FI '] });
      expect(parsed.genres).toEqual(['drama', 'sci-fi']);
    });

    it('rejects client-supplied rating stats', () => {
      const result = createMovieSchema.safeParse({ ...movieInput(), ratingAverage: 10 });
      expect(result.success).toBe(false);
    });
  });

  describe('updateMovieSchema', () => {
    it('does not add defaults for omitted fields', () => {
      expect(updateMovieSchema.parse({ title: 'New' })).toEqual({ title: 'New' });
    });

    it('rejects an empty update', () => {
      expect(updateMovieSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('searchMoviesQuery', () => {
    it('coerces query strings and applies defaults', () => {
      expect(searchMoviesQuery.parse({ yearFrom: '2000', minRating: '7.5' })).toMatchObject({
        yearFrom: 2000,
        minRating: 7.5,
        page: 1,
        limit: 20,
        sort: '-createdAt',
      });
    });

    it('ignores case in genre and sort', () => {
      expect(searchMoviesQuery.parse({ genre: 'DRAMA', sort: '-RATINGaverage' })).toMatchObject({
        genre: 'drama',
        sort: '-ratingAverage',
      });
    });

    it('rejects an unknown sort field', () => {
      expect(searchMoviesQuery.safeParse({ sort: 'budget' }).success).toBe(false);
    });

    it('rejects yearFrom > yearTo', () => {
      expect(searchMoviesQuery.safeParse({ yearFrom: '2010', yearTo: '2000' }).success).toBe(false);
    });
  });
});
