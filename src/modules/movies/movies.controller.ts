import type { Request, Response } from 'express';
import { moviesService } from './movies.service';
import type { SearchMoviesQuery } from './movies.validators';

type IdParams = { id: string };

export const moviesController = {
  async search(req: Request, res: Response) {
    const result = await moviesService.search(req.validated!.query as SearchMoviesQuery);
    res.json(result);
  },

  async getById(req: Request<IdParams>, res: Response) {
    const movie = await moviesService.getById(req.params.id);
    res.json({ movie });
  },

  async create(req: Request, res: Response) {
    const movie = await moviesService.create(req.body, req.user!.id);
    res.status(201).json({ movie });
  },

  async update(req: Request<IdParams>, res: Response) {
    const movie = await moviesService.update(req.params.id, req.body);
    res.json({ movie });
  },

  async remove(req: Request<IdParams>, res: Response) {
    await moviesService.remove(req.params.id);
    res.status(204).send();
  },
};
