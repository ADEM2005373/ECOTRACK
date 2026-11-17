import { tokenService, TokenService, JwtPayload } from './token.service';

/**
 * Service de gestion des JSON Web Tokens asymétriques RS256 (CDCF V2 - ADR-02 / ECO-14)
 * Clé privée RSA 2048 bits pour la signature des Access Tokens (15 min)
 * Clé publique exposée pour validation inter-services instantanée
 */
export class JwtService extends TokenService {
  /**
   * Alias explicite pour la signature RS256 de tokens d'accès
   */
  public signAccessToken(payload: object): string {
    return this.signToken(payload, 900);
  }
}

export const jwtService = new JwtService();
export { tokenService, JwtPayload };
