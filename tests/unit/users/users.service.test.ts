import { Types } from 'mongoose';
import { ReviewModel } from '../../../src/modules/reviews/review.model';
import { reviewsService } from '../../../src/modules/reviews/reviews.service';
import { UserModel } from '../../../src/modules/users/user.model';
import { usersService } from '../../../src/modules/users/users.service';

jest.mock('../../../src/modules/users/user.model', () => ({
  UserModel: { findById: jest.fn(), findByIdAndUpdate: jest.fn() },
}));
jest.mock('../../../src/modules/reviews/review.model', () => ({
  ReviewModel: { distinct: jest.fn(), deleteMany: jest.fn() },
}));
jest.mock('../../../src/modules/reviews/reviews.service', () => ({
  reviewsService: { recalculateMovieStats: jest.fn() },
}));

const users = jest.mocked(UserModel);
const reviews = jest.mocked(ReviewModel);
const recalc = jest.mocked(reviewsService.recalculateMovieStats);

const newId = () => new Types.ObjectId().toString();

describe('usersService (unit)', () => {
  describe('updateRole', () => {
    it('throws 404 when the user does not exist', async () => {
      users.findByIdAndUpdate.mockResolvedValue(null as never);
      await expect(
        usersService.updateRole(newId(), { role: 'admin' }, newId()),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when an admin tries to demote themselves', async () => {
      const id = newId();
      await expect(usersService.updateRole(id, { role: 'user' }, id)).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(users.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('throws 400 when an admin tries to delete themselves', async () => {
      const id = newId();
      await expect(usersService.remove(id, id)).rejects.toMatchObject({ statusCode: 400 });
      expect(users.findById).not.toHaveBeenCalled();
    });

    it('throws 404 when the user does not exist', async () => {
      users.findById.mockResolvedValue(null as never);
      await expect(usersService.remove(newId(), newId())).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("deletes the user's reviews and recalculates affected movies", async () => {
      const id = newId();
      const deleteOne = jest.fn();
      const movieA = new Types.ObjectId();
      const movieB = new Types.ObjectId();
      users.findById.mockResolvedValue({ deleteOne } as never);
      reviews.distinct.mockResolvedValue([movieA, movieB] as never);

      await usersService.remove(id, newId());

      expect(reviews.distinct).toHaveBeenCalledWith('movie', { user: id });
      expect(reviews.deleteMany).toHaveBeenCalledWith({ user: id });
      expect(deleteOne).toHaveBeenCalled();
      expect(recalc).toHaveBeenCalledTimes(2);
      expect(recalc).toHaveBeenCalledWith(String(movieA));
      expect(recalc).toHaveBeenCalledWith(String(movieB));
    });
  });
});
