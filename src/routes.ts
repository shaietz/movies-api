import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes';
import { moviesRouter } from './modules/movies/movies.routes';
import { movieReviewsRouter, reviewsRouter } from './modules/reviews/reviews.routes';
import { usersRouter } from './modules/users/users.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/movies/:movieId/reviews', movieReviewsRouter);
apiRouter.use('/movies', moviesRouter);
apiRouter.use('/reviews', reviewsRouter);
