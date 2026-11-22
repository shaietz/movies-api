/**
 * Unit tests with UserModel and the password helpers mocked (no database, no bcrypt).
 */
import { authService } from '../../../src/modules/auth/auth.service';
import { UserModel } from '../../../src/modules/users/user.model';
import { AppError } from '../../../src/shared/errors/AppError';
import { verifyToken } from '../../../src/shared/utils/jwt';
import { comparePassword, hashPassword } from '../../../src/shared/utils/password';

jest.mock('../../../src/modules/users/user.model', () => ({
  UserModel: { findOne: jest.fn(), findById: jest.fn(), create: jest.fn() },
}));
jest.mock('../../../src/shared/utils/password', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

const findOne = UserModel.findOne as jest.Mock;
const findById = UserModel.findById as jest.Mock;
const create = UserModel.create as jest.Mock;
const mockHash = hashPassword as jest.Mock;
const mockCompare = comparePassword as jest.Mock;

const fakeUser = (overrides: Record<string, unknown> = {}) => ({
  id: '665f1c2b9a1e4b3d2c1a0f9e',
  username: 'moviefan_1',
  email: 'fan@example.com',
  password: 'hashed',
  role: 'user',
  ...overrides,
});

/** findOne(...).lean() / findOne(...).select() resolving to `value`. */
const findOneResolves = (value: unknown) =>
  findOne.mockReturnValue({
    lean: jest.fn().mockResolvedValue(value),
    select: jest.fn().mockResolvedValue(value),
  });

async function expectAppError(promise: Promise<unknown>, statusCode: number) {
  const err = await promise.catch((e: unknown) => e);
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).statusCode).toBe(statusCode);
  return err as AppError;
}

const registerInput = { username: 'moviefan_1', email: 'fan@example.com', password: 'Secret123!' };

describe('authService (unit)', () => {
  describe('register', () => {
    beforeEach(() => {
      findOneResolves(null);
      mockHash.mockResolvedValue('hashed-pw');
      create.mockImplementation(async (data: Record<string, unknown>) => fakeUser(data));
    });

    it('hashes the password before saving', async () => {
      await authService.register(registerInput);
      expect(mockHash).toHaveBeenCalledWith('Secret123!');
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ password: 'hashed-pw' }));
    });

    it('always creates the user with role "user"', async () => {
      await authService.register({ ...registerInput, role: 'admin' } as typeof registerInput);
      expect(create).toHaveBeenCalledWith(expect.objectContaining({ role: 'user' }));
    });

    it('returns the user and a token', async () => {
      const result = await authService.register(registerInput);
      expect(result.user).toMatchObject({ email: 'fan@example.com' });
      expect(verifyToken(result.token)).toEqual({ id: result.user.id, role: 'user' });
    });

    it('throws 409 when the email is taken', async () => {
      findOneResolves(fakeUser());
      const err = await expectAppError(authService.register(registerInput), 409);
      expect(err.message).toMatch(/email/i);
      expect(create).not.toHaveBeenCalled();
    });

    it('throws 409 when the username is taken', async () => {
      findOneResolves(fakeUser({ email: 'other@example.com' }));
      const err = await expectAppError(authService.register(registerInput), 409);
      expect(err.message).toMatch(/username/i);
    });
  });

  describe('login', () => {
    const loginInput = { email: 'fan@example.com', password: 'Secret123!' };

    it('throws 401 for an unknown email', async () => {
      findOneResolves(null);
      mockCompare.mockResolvedValue(false);
      await expectAppError(authService.login(loginInput), 401);
    });

    it('throws 401 for a wrong password, with the same message as unknown email', async () => {
      mockCompare.mockResolvedValue(false);

      findOneResolves(null);
      const unknown = await expectAppError(authService.login(loginInput), 401);

      findOneResolves(fakeUser());
      const wrong = await expectAppError(authService.login(loginInput), 401);

      expect(wrong.message).toBe(unknown.message);
    });

    it('returns a token whose payload has the user id and role', async () => {
      const user = fakeUser({ role: 'admin' });
      findOneResolves(user);
      mockCompare.mockResolvedValue(true);

      const result = await authService.login(loginInput);
      expect(mockCompare).toHaveBeenCalledWith('Secret123!', 'hashed');
      expect(verifyToken(result.token)).toEqual({ id: user.id, role: 'admin' });
    });
  });

  describe('getMe', () => {
    it('returns the user', async () => {
      const user = fakeUser();
      findById.mockResolvedValue(user);
      await expect(authService.getMe(user.id)).resolves.toBe(user);
    });

    it('throws 404 when the user no longer exists', async () => {
      findById.mockResolvedValue(null);
      await expectAppError(authService.getMe('665f1c2b9a1e4b3d2c1a0f9e'), 404);
    });
  });
});
