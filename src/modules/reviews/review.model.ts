import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { RATING_MAX, RATING_MIN } from '../../shared/constants/movies';

const reviewSchema = new Schema(
  {
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: {
      type: Number,
      required: true,
      min: RATING_MIN,
      max: RATING_MAX,
      validate: { validator: Number.isInteger, message: 'Rating must be an integer' },
    },
    text: { type: String, trim: true, maxlength: 5000, default: '' },
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

// A user can review each movie only once.
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

export type Review = InferSchemaType<typeof reviewSchema>;
export type ReviewDocument = HydratedDocument<Review>;
export const ReviewModel = model('Review', reviewSchema);
