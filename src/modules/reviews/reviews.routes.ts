import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { validate } from '../../shared/middleware/validate';
import { reviewsController } from './reviews.controller';
import {
  createReviewSchema,
  listReviewsQuery,
  movieReviewsParams,
  reviewIdParams,
  updateReviewSchema,
} from './reviews.validators';

/** Mounted at /api/movies/:movieId/reviews */
export const movieReviewsRouter = Router({ mergeParams: true });

/** Mounted at /api/reviews */
export const reviewsRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: Reviews
 *     description: Movie reviews. Reading is public; writing requires login.
 * components:
 *   schemas:
 *     ReviewInput:
 *       type: object
 *       required: [rating]
 *       properties:
 *         rating: { type: integer, minimum: 1, maximum: 10, example: 9 }
 *         text: { type: string, example: Mind-bending and beautifully shot. }
 *     Review:
 *       allOf:
 *         - $ref: '#/components/schemas/ReviewInput'
 *         - type: object
 *           properties:
 *             id: { type: string }
 *             movie: { type: string }
 *             user:
 *               type: object
 *               properties:
 *                 id: { type: string }
 *                 username: { type: string }
 *             createdAt: { type: string, format: date-time }
 *             updatedAt: { type: string, format: date-time }
 *     ReviewResponse:
 *       type: object
 *       properties:
 *         review: { $ref: '#/components/schemas/Review' }
 */

/**
 * @openapi
 * /movies/{movieId}/reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: List reviews of a movie
 *     parameters:
 *       - { in: path, name: movieId, required: true, schema: { type: string } }
 *       - { in: query, name: sort, schema: { type: string, enum: [createdAt, -createdAt, rating, -rating], default: -createdAt } }
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Paginated reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Review' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   post:
 *     tags: [Reviews]
 *     summary: Review a movie (one review per user per movie)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: movieId, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReviewInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ReviewResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
movieReviewsRouter.get(
  '/',
  validate({ params: movieReviewsParams, query: listReviewsQuery }),
  reviewsController.listForMovie,
);
movieReviewsRouter.post(
  '/',
  authenticate,
  validate({ params: movieReviewsParams, body: createReviewSchema }),
  reviewsController.create,
);

/**
 * @openapi
 * /reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get a review
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: The review
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ReviewResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Reviews]
 *     summary: Edit your own review
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ReviewInput' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ReviewResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review (author or admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
reviewsRouter.get('/:id', validate({ params: reviewIdParams }), reviewsController.getById);
reviewsRouter.patch(
  '/:id',
  authenticate,
  validate({ params: reviewIdParams, body: updateReviewSchema }),
  reviewsController.update,
);
reviewsRouter.delete(
  '/:id',
  authenticate,
  validate({ params: reviewIdParams }),
  reviewsController.remove,
);
