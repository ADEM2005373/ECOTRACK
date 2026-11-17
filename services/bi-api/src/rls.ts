import { VerifiedUser } from './auth/jwt';
import { DENIED_ROLES, RlsRoleMap } from './config';

export interface EffectiveIdentity {
  username: string;
  roles: string[];
  datasets: string[];
}

/**
 * The RLS username sent to Power BI (USERPRINCIPALNAME() in the DAX filters).
 * Today: the opaque user ID from the verified token. Switching to another claim
 * (email, district code) is a change to this single function.
 */
export function rlsUsername(user: VerifiedUser): string {
  return user.sub;
}

/** Power BI RLS roles for an EcoTrack role, or null (fail closed: no mapping means no token). */
export function rlsRolesFor(role: string, roleMap: RlsRoleMap): readonly string[] | null {
  if (DENIED_ROLES.includes(role) || !Object.prototype.hasOwnProperty.call(roleMap, role)) {
    return null;
  }
  const roles = roleMap[role];
  return roles.length > 0 ? roles : null;
}

/** Built only from the verified token and server configuration, never from the request. */
export function buildEffectiveIdentity(
  user: VerifiedUser,
  rlsRoles: readonly string[],
  datasetId: string
): EffectiveIdentity {
  return {
    username: rlsUsername(user),
    roles: [...rlsRoles],
    datasets: [datasetId]
  };
}
