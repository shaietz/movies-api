import type { Request, Response } from 'express';
import { usersService } from './users.service';
import type { ListUsersQuery } from './users.validators';

type IdParams = { id: string };

export const usersController = {
  async list(req: Request, res: Response) {
    const result = await usersService.list(req.validated!.query as ListUsersQuery);
    res.json(result);
  },

  async getById(req: Request<IdParams>, res: Response) {
    const user = await usersService.getById(req.params.id);
    res.json({ user });
  },

  async updateRole(req: Request<IdParams>, res: Response) {
    const user = await usersService.updateRole(req.params.id, req.body, req.user!.id);
    res.json({ user });
  },

  async remove(req: Request<IdParams>, res: Response) {
    await usersService.remove(req.params.id, req.user!.id);
    res.status(204).send();
  },
};
