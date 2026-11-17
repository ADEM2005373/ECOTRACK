import { readBearerToken, verifyAccessToken } from '../src/auth/jwt';
import { keys, NOW_S, otherKeys, signJwt, validClaims } from './helpers';

const b64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

describe('verifyAccessToken (RS256 hardening)', () => {
  const verifyAt = (token: string) => verifyAccessToken(token, keys.publicKey, NOW_S);

  it('accepts a valid identity-api token and returns only sub and role', () => {
    expect(verifyAt(signJwt(validClaims()))).toEqual({ sub: '672f08a0b9e1a2001c45a001', role: 'ADMIN' });
  });

  it('rejects a token without exp (identity-api verifyToken would accept it)', () => {
    const { exp: _exp, ...claims } = validClaims();
    expect(verifyAt(signJwt(claims))).toBeNull();
  });

  it.each([
    ['a non-numeric exp', { exp: String(NOW_S + 600) }],
    ['an expired token', { exp: NOW_S - 1 }],
    ['exp exactly now', { exp: NOW_S }],
    ['a wrong issuer', { iss: 'someone-else' }],
    ['a missing issuer', { iss: undefined }],
    ['a missing sub', { sub: undefined }],
    ['an empty sub', { sub: '  ' }],
    ['a missing role', { role: undefined }],
    ['a non-string role', { role: ['ADMIN'] }],
    ['a token not valid yet (nbf)', { nbf: NOW_S + 60 }]
  ])('rejects %s', (_label, overrides) => {
    expect(verifyAt(signJwt(validClaims(overrides)))).toBeNull();
  });

  it('rejects alg "none" with an empty signature', () => {
    const token = `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url(validClaims())}.`;
    expect(verifyAt(token)).toBeNull();
  });

  it('rejects alg "none" even with a signature segment', () => {
    const valid = signJwt(validClaims());
    const [, payload, signature] = valid.split('.');
    expect(verifyAt(`${b64url({ alg: 'none' })}.${payload}.${signature}`)).toBeNull();
  });

  it.each(['HS256', 'RS512', 'PS256', 'ES256'])('rejects alg %s', (alg) => {
    expect(verifyAt(signJwt(validClaims(), { alg, typ: 'JWT' }))).toBeNull();
  });

  it('rejects a header without alg', () => {
    expect(verifyAt(signJwt(validClaims(), { typ: 'JWT' }))).toBeNull();
  });

  it('rejects a token signed with another private key', () => {
    expect(verifyAt(signJwt(validClaims(), undefined, otherKeys.privateKey))).toBeNull();
  });

  it('rejects a payload changed after signing (role escalation)', () => {
    const [header, , signature] = signJwt(validClaims({ role: 'CITOYEN' })).split('.');
    expect(verifyAt(`${header}.${b64url(validClaims({ role: 'ADMIN' }))}.${signature}`)).toBeNull();
  });

  it.each(['', 'abc', 'a.b', 'a.b.c.d', 'a.b.c', '!!.@@.##'])('rejects malformed token %p', (token) => {
    expect(verifyAt(token)).toBeNull();
  });
});

describe('readBearerToken', () => {
  it('extracts the token of a Bearer header', () => {
    expect(readBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it.each([undefined, '', 'abc.def.ghi', 'Basic abc', 'Bearer ', 'Bearer a b', 'bearer abc.def.ghi'])(
    'returns null for %p',
    (header) => {
      expect(readBearerToken(header)).toBeNull();
    }
  );
});
