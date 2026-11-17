/** Refresh the embed token 10 minutes before it expires (Microsoft's recommendation). */
export const REFRESH_MARGIN_MS = 10 * 60 * 1000;

/** Delay before a failed refresh is tried again, while the current token is still valid. */
export const REFRESH_RETRY_MS = 30 * 1000;

/**
 * Time at which the embed token should be refreshed. For a token that lives less than
 * twice the margin, refresh at half its remaining life instead, so it is never refreshed
 * immediately after being received.
 */
export function refreshAt(expiresAtMs: number, nowMs: number): number {
  const remaining = expiresAtMs - nowMs;
  if (remaining <= 0) {
    return nowMs;
  }
  return expiresAtMs - Math.min(REFRESH_MARGIN_MS, remaining / 2);
}
