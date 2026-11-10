import crypto from 'crypto';
import { IUser, AuthTokens, UserRole } from '@ecotrack/shared';

// Clé privée et clé publique RSA pour signature RS256 (CDCF V2 - ADR-02)
let privateKeyPem = process.env.JWT_PRIVATE_KEY;
let publicKeyPem = process.env.JWT_PUBLIC_KEY;

if (!privateKeyPem || !publicKeyPem) {
  // Génération automatique d'une paire de clés RSA 2048 bits pour développement local
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
  privateKeyPem = privateKey;
  publicKeyPem = publicKey;
}

function base64UrlEncode(data: string | Buffer): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return buf.toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  fullName: string;
  iat: number;
  exp: number;
  iss: string;
}

export class TokenService {
  private readonly issuer = 'ecotrack-identity-api';
  private readonly accessTtlSeconds = 900; // 15 minutes (ADR-02)
  private readonly refreshTtlDays = 7;     // 7 jours

  /**
   * Clé publique pour validation inter-services (ADR-02)
   */
  getPublicKey(): string {
    return publicKeyPem!;
  }

  /**
   * Signe un payload avec RS256
   */
  signToken(payload: object, expiresInSeconds: number): string {
    const now = Math.floor(Date.now() / 1000);
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    const fullPayload = {
      ...payload,
      iss: this.issuer,
      iat: now,
      exp: now + expiresInSeconds
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
    const signatureInput = `${encodedHeader}.${encodedPayload}`;

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signatureInput);
    const signature = signer.sign(privateKeyPem!);
    const encodedSignature = base64UrlEncode(signature);

    return `${signatureInput}.${encodedSignature}`;
  }

  /**
   * Vérifie un JWT RS256
   */
  verifyToken<T = JwtPayload>(token: string): T | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [headerB64, payloadB64, sigB64] = parts;
      const signatureInput = `${headerB64}.${payloadB64}`;

      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(signatureInput);

      const sigBuffer = Buffer.from(
        sigB64.replace(/-/g, '+').replace(/_/g, '/'),
        'base64'
      );

      const isValid = verifier.verify(publicKeyPem!, sigBuffer);
      if (!isValid) return null;

      const payload = JSON.parse(base64UrlDecode(payloadB64)) as T & { exp?: number };
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null; // Expiré
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Délivre la paire de tokens Access + Refresh (Conforme OpenAPI AuthTokenResponse)
   */
  generateAuthTokens(user: IUser): AuthTokens {
    const accessToken = this.signToken(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      },
      this.accessTtlSeconds
    );

    // Refresh token aléatoire sécurisé (256 bits)
    const refreshToken = crypto.randomBytes(32).toString('hex');

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTtlSeconds,
      tokenType: 'Bearer',
      user
    };
  }
}

export const tokenService = new TokenService();
