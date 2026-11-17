import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../../src/shared/utils/jwt';

describe('jwt utils', () => {
  const user = { id: '665f1c2b9a1e4b3d2c1a0f9e', role: 'admin' as const };

  it('round-trips the user id and role', () => {
    expect(verifyToken(signToken(user))).toEqual(user);
  });

  it('rejects a token signed with another secret', () => {
    const forged = jwt.sign({ sub: user.id, role: 'admin' }, 'some-other-secret-value');
    expect(() => verifyToken(forged)).toThrow();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign({ sub: user.id, role: 'user' }, process.env.JWT_SECRET!, {
      expiresIn: -10,
    });
    expect(() => verifyToken(expired)).toThrow();
  });

  it('rejects a token with an unknown role', () => {
    const bad = jwt.sign({ sub: user.id, role: 'superuser' }, process.env.JWT_SECRET!);
    expect(() => verifyToken(bad)).toThrow('Malformed token payload');
  });
});
