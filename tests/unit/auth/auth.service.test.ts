/**
 * Unit tests with UserModel mocked:
 *   jest.mock('../../../src/modules/users/user.model');
 */
describe('authService (unit)', () => {
  describe('register', () => {
    it.todo('hashes the password before saving');
    it.todo('always creates the user with role "user"');
    it.todo('returns the user and a token');
  });

  describe('login', () => {
    it.todo('throws 401 for an unknown email');
    it.todo('throws 401 for a wrong password, with the same message as unknown email');
    it.todo('returns a token whose payload has the user id and role');
  });
});
