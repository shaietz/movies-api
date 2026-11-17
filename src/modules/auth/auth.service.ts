import { AppError } from '../../shared/errors/AppError';
import type { UserDocument } from '../users/user.model';
import type { LoginInput, RegisterInput } from './auth.validators';

export interface AuthResult {
  user: UserDocument;
  token: string;
}

/**
 * OWNER: auth module
 *
 * register: always creates a regular `user` (never admin) -> 409 if email/username taken.
 * login:    -> 401 with a generic message for unknown email OR wrong password.
 * getMe:    -> 404 if the user from the token no longer exists.
 *
 * Helpers ready to use: hashPassword/comparePassword (shared/utils/password),
 * signToken (shared/utils/jwt), UserModel (users/user.model).
 */
export const authService = {
  async register(_input: RegisterInput): Promise<AuthResult> {
    throw AppError.notImplemented('auth.register');
  },

  async login(_input: LoginInput): Promise<AuthResult> {
    throw AppError.notImplemented('auth.login');
  },

  async getMe(_userId: string): Promise<UserDocument> {
    throw AppError.notImplemented('auth.getMe');
  },
};
