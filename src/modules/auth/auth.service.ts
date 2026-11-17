import { AppError } from '../../shared/errors/AppError';
import { signToken } from '../../shared/utils/jwt';
import { comparePassword, hashPassword } from '../../shared/utils/password';
import { UserModel, type UserDocument } from '../users/user.model';
import type { LoginInput, RegisterInput } from './auth.validators';

export interface AuthResult {
  user: UserDocument;
  token: string;
}

const INVALID_CREDENTIALS = 'Invalid email or password';

const issueToken = (user: UserDocument) => signToken({ id: user.id, role: user.role });

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await UserModel.findOne({
      $or: [{ email: input.email }, { username: input.username }],
    }).lean();

    if (existing) {
      throw AppError.conflict(
        existing.email === input.email ? 'Email is already registered' : 'Username is already taken',
      );
    }

    const user = await UserModel.create({
      username: input.username,
      email: input.email,
      password: await hashPassword(input.password),
      role: 'user',
    });

    return { user, token: issueToken(user) };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await UserModel.findOne({ email: input.email }).select('+password');

    if (!user) {
      throw AppError.unauthorized(INVALID_CREDENTIALS);
    }

    if (!(await comparePassword(input.password, user.password))) {
      throw AppError.unauthorized(INVALID_CREDENTIALS);
    }

    return { user, token: issueToken(user) };
  },

  async getMe(userId: string): Promise<UserDocument> {
    const user = await UserModel.findById(userId);
    if (!user) throw AppError.notFound('User');
    return user;
  },
};
