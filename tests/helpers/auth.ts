import { Types } from 'mongoose';
import { UserModel } from '../../src/modules/users/user.model';
import type { Role } from '../../src/shared/constants/roles';
import { signToken } from '../../src/shared/utils/jwt';
import { hashPassword } from '../../src/shared/utils/password';

let counter = 0;

/**
 * Inserts a user straight into the DB and returns it with a valid JWT.
 * Works even before the auth module is implemented, so movies/reviews/users
 * can be developed and tested in parallel.
 */
export async function createUser(
  overrides: Partial<{ username: string; email: string; password: string; role: Role }> = {},
) {
  counter += 1;
  const password = overrides.password ?? 'Password123!';
  const user = await UserModel.create({
    username: overrides.username ?? `user_${counter}`,
    email: overrides.email ?? `user${counter}@test.com`,
    password: await hashPassword(password),
    role: overrides.role ?? 'user',
  });
  const token = signToken({ id: user.id, role: user.role });
  return { user, token, password };
}

export const createAdmin = (overrides: Parameters<typeof createUser>[0] = {}) =>
  createUser({ ...overrides, role: 'admin' });

/** A valid token for a user that is NOT in the database. Good for auth-guard tests. */
export function tokenFor(role: Role = 'user', id = new Types.ObjectId().toString()) {
  return signToken({ id, role });
}
