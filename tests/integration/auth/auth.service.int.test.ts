/**
 * Integration tests: real service + real Mongoose models + in-memory MongoDB.
 * The DB is wiped after every test (tests/setup/db.ts).
 */
import { authService } from '../../../src/modules/auth/auth.service';
import { UserModel } from '../../../src/modules/users/user.model';
import { AppError } from '../../../src/shared/errors/AppError';
import { comparePassword } from '../../../src/shared/utils/password';

const input = { username: 'moviefan_1', email: 'fan@example.com', password: 'Secret123!' };

async function expectStatus(promise: Promise<unknown>, statusCode: number) {
  const err = await promise.catch((e: unknown) => e);
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).statusCode).toBe(statusCode);
}

describe('authService (integration)', () => {
  it('register stores a bcrypt hash, never the plain password', async () => {
    const { user } = await authService.register(input);
    const stored = await UserModel.findById(user.id).select('+password');

    expect(stored!.password).not.toBe(input.password);
    expect(stored!.password).toMatch(/^\$2[aby]\$/);
    expect(await comparePassword(input.password, stored!.password)).toBe(true);
    expect(stored!.role).toBe('user');
  });

  it('register rejects a duplicate email with 409', async () => {
    await authService.register(input);
    await expectStatus(authService.register({ ...input, username: 'someone_else' }), 409);
  });

  it('register rejects a duplicate username with 409', async () => {
    await authService.register(input);
    await expectStatus(authService.register({ ...input, email: 'other@example.com' }), 409);
  });

  it('login works with the password used at registration', async () => {
    const { user } = await authService.register(input);
    const result = await authService.login({ email: input.email, password: input.password });
    expect(result.user.id).toBe(user.id);
    expect(result.token).toEqual(expect.any(String));
  });

  it('login rejects a wrong password with 401', async () => {
    await authService.register(input);
    await expectStatus(authService.login({ email: input.email, password: 'wrong-password' }), 401);
  });
});
