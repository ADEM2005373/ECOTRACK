import { KeyObject, verify } from 'node:crypto';

/** Issuer set by identity-api (services/identity-api/src/services/token.service.ts). */
export const EXPECTED_ISSUER = 'ecotrack-identity-api';

export interface VerifiedUser {
  sub: string;
  role: string;
}

const BASE64URL_SEGMENT = /^[A-Za-z0-9_-]+$/;

function decodeJsonSegment(segment: string): unknown {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Strict RS256 access-token verification, stricter than identity-api's own verifyToken:
 * alg must be RS256 (so "none" and HS256 are refused), the signature must match the
 * identity-api public key, iss must match, exp is mandatory and in the future, and
 * sub/role must be present. Returns null on any failure, without saying why.
 */
export function verifyAccessToken(token: string, publicKey: KeyObject, nowSeconds: number): VerifiedUser | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts.every((part) => BASE64URL_SEGMENT.test(part))) {
    return null;
  }
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = decodeJsonSegment(headerB64);
  if (!isRecord(header) || header.alg !== 'RS256') {
    return null;
  }

  let signatureValid: boolean;
  try {
    signatureValid = verify(
      'RSA-SHA256',
      Buffer.from(`${headerB64}.${payloadB64}`),
      publicKey,
      Buffer.from(signatureB64, 'base64url')
    );
  } catch {
    return null;
  }
  if (!signatureValid) {
    return null;
  }

  const payload = decodeJsonSegment(payloadB64);
  if (!isRecord(payload) || payload.iss !== EXPECTED_ISSUER) {
    return null;
  }
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp) || payload.exp <= nowSeconds) {
    return null;
  }
  if (typeof payload.nbf === 'number' && payload.nbf > nowSeconds) {
    return null;
  }
  const sub = nonEmptyString(payload.sub);
  const role = nonEmptyString(payload.role);
  if (sub === null || role === null) {
    return null;
  }
  return { sub, role };
}

const BEARER_PATTERN = /^Bearer ([A-Za-z0-9._-]+)$/;

/** Extracts the token of an "Authorization: Bearer <token>" header, or null. */
export function readBearerToken(header: string | undefined): string | null {
  if (typeof header !== 'string') {
    return null;
  }
  const match = BEARER_PATTERN.exec(header.trim());
  return match ? match[1] : null;
}
