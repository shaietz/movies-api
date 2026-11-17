import { AppError } from '../../shared/errors/AppError';
import { buildPaginated, type Paginated } from '../../shared/utils/pagination';
import { ReviewModel } from '../reviews/review.model';
import { reviewsService } from '../reviews/reviews.service';
import { UserModel, type UserDocument } from './user.model';
import type { ListUsersQuery, UpdateRoleInput } from './users.validators';

export const usersService = {
  async list({ page, limit, role }: ListUsersQuery): Promise<Paginated<UserDocument>> {
    const filter = role ? { role } : {};
    const [data, total] = await Promise.all([
      UserModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      UserModel.countDocuments(filter),
    ]);
    return buildPaginated(data, total, page, limit);
  },

  async getById(id: string): Promise<UserDocument> {
    const user = await UserModel.findById(id);
    if (!user) throw AppError.notFound('User');
    return user;
  },

  async updateRole(id: string, { role }: UpdateRoleInput, actorId: string): Promise<UserDocument> {
    if (id === actorId) {
      throw AppError.badRequest('You cannot update your own role');
    }
    const user = await UserModel.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true },
    );
    if (!user) throw AppError.notFound('User');
    return user;
  },

  async remove(id: string, actorId: string): Promise<void> {
    if (id === actorId) throw AppError.badRequest('You cannot delete yourself');

    const user = await UserModel.findById(id);
    if (!user) throw AppError.notFound('User');

    // Reviews first, so a failure partway never leaves reviews pointing at a missing user.
    const movieIds = await ReviewModel.distinct('movie', { user: id });
    await ReviewModel.deleteMany({ user: id });
    await user.deleteOne();

    await Promise.all(
      movieIds.map((movieId) => reviewsService.recalculateMovieStats(String(movieId))),
    );
  },
};
