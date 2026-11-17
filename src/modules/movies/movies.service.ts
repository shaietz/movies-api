import { AppError } from '../../shared/errors/AppError';
import type { Paginated } from '../../shared/utils/pagination';
import type { MovieDocument } from './movie.model';
import type { CreateMovieInput, SearchMoviesQuery, UpdateMovieInput } from './movies.validators';

/**
 * OWNER: movies module
 *
 * search:  filters (q = partial title match, genre, director, actor, yearFrom/yearTo,
 *          minRating), sort, pagination. Public.
 * getById: -> 404 if missing. Response includes ratingAverage and reviewCount.
 * create:  admin only (enforced in routes). Store createdBy = adminId.
 *          Same title + releaseYear -> 409 (unique index, handled by errorHandler).
 * update:  admin only. -> 404 if missing. Cannot change rating stats or createdBy.
 * remove:  admin only. -> 404 if missing. Also deletes all reviews of the movie (ReviewModel).
 */
export const moviesService = {
  async search(_query: SearchMoviesQuery): Promise<Paginated<MovieDocument>> {
    throw AppError.notImplemented('movies.search');
  },

  async getById(_id: string): Promise<MovieDocument> {
    throw AppError.notImplemented('movies.getById');
  },

  async create(_input: CreateMovieInput, _adminId: string): Promise<MovieDocument> {
    throw AppError.notImplemented('movies.create');
  },

  async update(_id: string, _input: UpdateMovieInput): Promise<MovieDocument> {
    throw AppError.notImplemented('movies.update');
  },

  async remove(_id: string): Promise<void> {
    throw AppError.notImplemented('movies.remove');
  },
};
