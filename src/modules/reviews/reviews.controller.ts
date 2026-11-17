import type { Request, Response } from 'express';
import { reviewsService } from './reviews.service';
import type { ListReviewsQuery } from './reviews.validators';

type MovieParams = { movieId: string };
type IdParams = { id: string };

export const reviewsController = {
  async listForMovie(req: Request<MovieParams>, res: Response) {
    const result = await reviewsService.listForMovie(
      req.params.movieId,
      req.validated!.query as ListReviewsQuery,
    );
    res.json(result);
  },

  async create(req: Request<MovieParams>, res: Response) {
    const review = await reviewsService.create(req.params.movieId, req.body, req.user!.id);
    res.status(201).json({ review });
  },

  async getById(req: Request<IdParams>, res: Response) {
    const review = await reviewsService.getById(req.params.id);
    res.json({ review });
  },

  async update(req: Request<IdParams>, res: Response) {
    const review = await reviewsService.update(req.params.id, req.body, req.user!);
    res.json({ review });
  },

  async remove(req: Request<IdParams>, res: Response) {
    await reviewsService.remove(req.params.id, req.user!);
    res.status(204).send();
  },
};
