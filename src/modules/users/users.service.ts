import { AppError } from '../../shared/errors/AppError';
import type { Paginated } from '../../shared/utils/pagination';
import type { UserDocument } from './user.model';
import type { ListUsersQuery, UpdateRoleInput } from './users.validators';

/**
 * OWNER: users module (admin-only user management)
 *
 * list:       paginated, optional filter by role.
 * getById:    -> 404 if missing.
 * updateRole: -> 404 if missing; an admin cannot demote themselves (-> 400),
 *                so the system never ends up without an admin by accident.
 * remove:     -> 404 if missing; an admin cannot delete themselves (-> 400).
 *                Decision: the user's reviews are deleted too and the affected
 *                movies' rating stats are recalculated (reviewsService.recalculateMovieStats).
 */
export const usersService = {
  async list(_query: ListUsersQuery): Promise<Paginated<UserDocument>> {
    throw AppError.notImplemented('users.list');
  },

  async getById(_id: string): Promise<UserDocument> {
    throw AppError.notImplemented('users.getById');
  },

  async updateRole(_id: string, _input: UpdateRoleInput, _actorId: string): Promise<UserDocument> {
    throw AppError.notImplemented('users.updateRole');
  },

  async remove(_id: string, _actorId: string): Promise<void> {
    throw AppError.notImplemented('users.remove');
  },
};
