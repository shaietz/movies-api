import { comparePassword, hashPassword } from '../../../src/shared/utils/password';

describe('password utils', () => {
  it('hashes so the plain password is not stored', async () => {
    const hash = await hashPassword('Secret123!');
    expect(hash).not.toBe('Secret123!');
  });

  it('matches the correct password and rejects a wrong one', async () => {
    const hash = await hashPassword('Secret123!');
    await expect(comparePassword('Secret123!', hash)).resolves.toBe(true);
    await expect(comparePassword('wrong', hash)).resolves.toBe(false);
  });
});
