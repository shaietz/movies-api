import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { FIRST_FILM_YEAR, GENRES } from '../../shared/constants/movies';

const movieSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    releaseYear: { type: Number, required: true, min: FIRST_FILM_YEAR },
    genres: {
      type: [{ type: String, enum: GENRES }],
      validate: [(v: string[]) => v.length > 0, 'At least one genre is required'],
    },
    director: { type: String, required: true, trim: true, maxlength: 100 },
    actors: { type: [{ type: String, trim: true }], default: [] },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    /** Admin who added the movie. */
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    /**
     * Denormalized rating stats, kept in sync by reviews.service.recalculateMovieStats()
     * whenever a review is created, updated or deleted. Never set these from the API.
     */
    ratingAverage: { type: Number, default: 0, min: 0, max: 10 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = String(ret._id);
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Same title + year = same movie (case-insensitive).
movieSchema.index(
  { title: 1, releaseYear: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
movieSchema.index({ genres: 1 });
movieSchema.index({ ratingAverage: -1 });

export type Movie = InferSchemaType<typeof movieSchema>;
export type MovieDocument = HydratedDocument<Movie>;
export const MovieModel = model('Movie', movieSchema);
