import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate';
import { authorize } from '../../shared/middleware/authorize';
import { validate } from '../../shared/middleware/validate';
import { moviesController } from './movies.controller';
import {
  createMovieSchema,
  movieIdParams,
  searchMoviesQuery,
  updateMovieSchema,
} from './movies.validators';

export const moviesRouter = Router();

/**
 * @openapi
 * tags:
 *   - name: Movies
 *     description: Movie catalog. Reading is public; writing is admin only.
 * components:
 *   schemas:
 *     Genre:
 *       type: string
 *       enum: [action, adventure, animation, comedy, crime, documentary, drama, family, fantasy, history, horror, music, mystery, romance, sci-fi, thriller, war, western]
 *     MovieInput:
 *       type: object
 *       required: [title, releaseYear, genres, director]
 *       properties:
 *         title: { type: string, example: Inception }
 *         releaseYear: { type: integer, example: 2010 }
 *         genres: { type: array, items: { $ref: '#/components/schemas/Genre' }, example: [sci-fi, thriller] }
 *         director: { type: string, example: Christopher Nolan }
 *         actors: { type: array, items: { type: string }, example: [Leonardo DiCaprio, Elliot Page] }
 *         description: { type: string, example: A thief who steals secrets through dreams. }
 *     Movie:
 *       allOf:
 *         - $ref: '#/components/schemas/MovieInput'
 *         - type: object
 *           properties:
 *             id: { type: string }
 *             createdBy: { type: string, description: Id of the admin who added the movie }
 *             ratingAverage: { type: number, example: 8.4, description: Average review rating (0 if no reviews) }
 *             reviewCount: { type: integer, example: 12 }
 *             createdAt: { type: string, format: date-time }
 *             updatedAt: { type: string, format: date-time }
 *     MovieResponse:
 *       type: object
 *       properties:
 *         movie: { $ref: '#/components/schemas/Movie' }
 */

/**
 * @openapi
 * /movies:
 *   get:
 *     tags: [Movies]
 *     summary: Search and list movies
 *     parameters:
 *       - { in: query, name: q, description: Partial title match, schema: { type: string } }
 *       - { in: query, name: genre, schema: { $ref: '#/components/schemas/Genre' } }
 *       - { in: query, name: director, schema: { type: string } }
 *       - { in: query, name: actor, schema: { type: string } }
 *       - { in: query, name: yearFrom, schema: { type: integer } }
 *       - { in: query, name: yearTo, schema: { type: integer } }
 *       - { in: query, name: minRating, schema: { type: number, minimum: 0, maximum: 10 } }
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *           enum: [title, -title, releaseYear, -releaseYear, ratingAverage, -ratingAverage, reviewCount, -reviewCount, createdAt, -createdAt]
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 20, maximum: 100 } }
 *     responses:
 *       200:
 *         description: Paginated movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data: { type: array, items: { $ref: '#/components/schemas/Movie' } }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *   post:
 *     tags: [Movies]
 *     summary: Add a movie (admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/MovieInput' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MovieResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
moviesRouter.get('/', validate({ query: searchMoviesQuery }), moviesController.search);
moviesRouter.post(
  '/',
  authenticate,
  authorize('admin'),
  validate({ body: createMovieSchema }),
  moviesController.create,
);

/**
 * @openapi
 * /movies/{id}:
 *   get:
 *     tags: [Movies]
 *     summary: Get movie details, including average rating and review count
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: The movie
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MovieResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Movies]
 *     summary: Update a movie (admin). Send only the fields to change.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               title: { type: string, example: Inception }
 *               releaseYear: { type: integer, example: 2010 }
 *               genres: { type: array, items: { $ref: '#/components/schemas/Genre' } }
 *               director: { type: string }
 *               actors: { type: array, items: { type: string } }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/MovieResponse' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   delete:
 *     tags: [Movies]
 *     summary: Delete a movie and all its reviews (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       204: { description: Deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
moviesRouter.get('/:id', validate({ params: movieIdParams }), moviesController.getById);
moviesRouter.patch(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: movieIdParams, body: updateMovieSchema }),
  moviesController.update,
);
moviesRouter.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  validate({ params: movieIdParams }),
  moviesController.remove,
);
