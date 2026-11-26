import { MovieModel } from '../../../src/modules/movies/movie.model';
import { ReviewModel } from '../../../src/modules/reviews/review.model';
import { reviewsService } from '../../../src/modules/reviews/reviews.service';
import { UserModel } from '../../../src/modules/users/user.model';
import { usersService } from '../../../src/modules/users/users.service';
import { createAdmin, createUser } from '../../helpers/auth';
import { createMovie, createReview } from '../../helpers/factories';

describe('usersService (integration)', () => {
  it('list paginates and filters by role', async () => {
    await createAdmin();
    for (let i = 0; i < 4; i += 1) await createUser();

    const page = await usersService.list({ page: 2, limit: 3 });
    expect(page.data).toHaveLength(2);
    expect(page.pagination).toEqual({ page: 2, limit: 3, total: 5, totalPages: 2 });

    const admins = await usersService.list({ page: 1, limit: 20, role: 'admin' });
    expect(admins.pagination.total).toBe(1);
    expect(admins.data.every((u) => u.role === 'admin')).toBe(true);
  });

  it('list never includes password hashes', async () => {
    await createUser();
    const { data } = await usersService.list({ page: 1, limit: 20 });
    expect(data[0].password).toBeUndefined();
    expect(data[0].toJSON()).not.toHaveProperty('password');
  });

  it('remove deletes the user and their reviews', async () => {
    const recalc = jest.spyOn(reviewsService, 'recalculateMovieStats').mockResolvedValue();
    const { user: admin } = await createAdmin();
    const { user } = await createUser();
    const { user: other } = await createUser();
    const movie = await createMovie();
    await createReview({ movie: movie._id, user: user._id });
    await createReview({ movie: movie._id, user: other._id });

    await usersService.remove(user.id, admin.id);

    expect(await UserModel.findById(user.id)).toBeNull();
    expect(await ReviewModel.countDocuments({ user: user._id })).toBe(0);
    expect(await ReviewModel.countDocuments({ user: other._id })).toBe(1);
    expect(recalc).toHaveBeenCalledWith(movie.id);
    recalc.mockRestore();
  });

  it('remove updates the affected movies rating stats', async () => {
    const { user: admin } = await createAdmin();
    const { user } = await createUser();
    const { user: other } = await createUser();
    const movie = await createMovie();
    await createReview({ movie: movie._id, user: user._id, rating: 2 });
    await createReview({ movie: movie._id, user: other._id, rating: 8 });
    await reviewsService.recalculateMovieStats(movie.id);

    await usersService.remove(user.id, admin.id);

    const updated = await MovieModel.findById(movie._id).lean();
    expect(updated).toMatchObject({ ratingAverage: 8, reviewCount: 1 });
  });
});
