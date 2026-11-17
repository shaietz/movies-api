import { Types } from 'mongoose';
import { MovieModel } from '../../src/modules/movies/movie.model';
import { ReviewModel } from '../../src/modules/reviews/review.model';
import type { CreateMovieInput } from '../../src/modules/movies/movies.validators';

let counter = 0;

/** Valid request body for POST /api/movies. */
export function movieInput(overrides: Partial<CreateMovieInput> = {}): CreateMovieInput {
  counter += 1;
  return {
    title: `Test Movie ${counter}`,
    releaseYear: 2010,
    genres: ['drama'],
    director: 'Jane Director',
    actors: ['Actor One', 'Actor Two'],
    description: 'A movie used in tests.',
    ...overrides,
  };
}

/** Inserts a movie directly into the DB. */
export function createMovie(
  overrides: Partial<CreateMovieInput> & { createdBy?: Types.ObjectId | string } = {},
) {
  const { createdBy, ...rest } = overrides;
  return MovieModel.create({
    ...movieInput(rest),
    createdBy: createdBy ?? new Types.ObjectId(),
  });
}

/** Inserts a review directly into the DB (does NOT update the movie's rating stats). */
export function createReview(data: {
  movie: Types.ObjectId | string;
  user: Types.ObjectId | string;
  rating?: number;
  text?: string;
}) {
  return ReviewModel.create({ rating: 7, text: 'Pretty good', ...data });
}
