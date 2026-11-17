/**
 * Integration tests: real service + real Mongoose models + in-memory MongoDB.
 * The DB is wiped after every test (tests/setup/db.ts).
 */
describe('authService (integration)', () => {
  it.todo('register stores a bcrypt hash, never the plain password');
  it.todo('register rejects a duplicate email with 409');
  it.todo('register rejects a duplicate username with 409');
  it.todo('login works with the password used at registration');
});
