import type { QueryFilter } from 'mongoose';
import { AppError } from '../../shared/errors/AppError';
import { buildPaginated, type Paginated } from '../../shared/utils/pagination';
import { escapeRegex } from '../../shared/utils/regex';
import { ReviewModel } from '../reviews/review.model';
import { MovieModel, type Movie, type MovieDocument } from './movie.model';
import type {
  CreateMovieInput,
  MovieSortField,
  SearchMoviesQuery,
  UpdateMovieInput,
} from './movies.validators';

/** Same collation as the unique title index: case-insensitive comparisons and sorting. */
const CASE_INSENSITIVE = { locale: 'en', strength: 2 } as const;

const containsIgnoreCase = (value: string) => ({ $regex: escapeRegex(value), $options: 'i' });

/** Turns the validated search query into a MongoDB filter. */
export function buildMovieFilter(query: SearchMoviesQuery): QueryFilter<Movie> {
  const filter: Record<string, unknown> = {};

  if (query.q) filter.title = containsIgnoreCase(query.q);
  if (query.genre) filter.genres = query.genre;
  if (query.director) filter.director = containsIgnoreCase(query.director);
  // A regex on an array field matches if any element matches.
  if (query.actor) filter.actors = containsIgnoreCase(query.actor);

  if (query.yearFrom !== undefined || query.yearTo !== undefined) {
    filter.releaseYear = {
      ...(query.yearFrom !== undefined && { $gte: query.yearFrom }),
      ...(query.yearTo !== undefined && { $lte: query.yearTo }),
    };
  }

  if (query.minRating !== undefined) filter.ratingAverage = { $gte: query.minRating };

  return filter as QueryFilter<Movie>;
}

/** `'-ratingAverage'` -> `{ ratingAverage: -1, _id: -1 }`. `_id` keeps pagination order stable. */
export function buildMovieSort(sort: MovieSortField): Record<string, 1 | -1> {
  const direction = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');
  return { [field]: direction, _id: direction };
}

export const moviesService = {
  async search(query: SearchMoviesQuery): Promise<Paginated<MovieDocument>> {
    const filter = buildMovieFilter(query);
    const { page, limit } = query;

    const [data, total] = await Promise.all([
      MovieModel.find(filter)
        .sort(buildMovieSort(query.sort))
        .skip((page - 1) * limit)
        .limit(limit)
        .collation(CASE_INSENSITIVE),
      MovieModel.countDocuments(filter),
    ]);

    return buildPaginated(data, total, page, limit);
  },

  async getById(id: string): Promise<MovieDocument> {
    const movie = await MovieModel.findById(id);
    if (!movie) throw AppError.notFound('Movie');
    return movie;
  },

  async create(input: CreateMovieInput, adminId: string): Promise<MovieDocument> {
    return MovieModel.create({ ...input, createdBy: adminId });
  },

  async update(id: string, input: UpdateMovieInput): Promise<MovieDocument> {
    const movie = await MovieModel.findById(id);
    if (!movie) throw AppError.notFound('Movie');
    movie.set(input);
    await movie.save();
    return movie;
  },

  async remove(id: string): Promise<void> {
    const movie = await MovieModel.findByIdAndDelete(id);
    if (!movie) throw AppError.notFound('Movie');
    await ReviewModel.deleteMany({ movie: movie._id });
  },
};
