/**
 * Which hosts the auth API answers on.
 *
 * Production serves one origin, `BETTER_AUTH_URL`, and does not need to be listed here:
 * Better Auth falls back to that URL and trusts its origin. Local dev is not one origin.
 * `bun run dev` is reached through the orb's portal proxy, which rewrites `Host` to the
 * portal hostname, so the browser sends `Origin: https://<orb>-p3000.onamp.dev`. A static
 * base URL rejects every sign-in from there with INVALID_ORIGIN, and the login form can
 * only report that as a wrong password.
 *
 * So the portal pattern is allowed whenever the configured origin is not a real
 * deployment — loopback, or unset — and any other host can be named in
 * `BETTER_AUTH_ALLOWED_HOSTS` for previews and staging. Sessions stay host-only cookies,
 * so one created through the portal is never sent to the real domain.
 *
 * Pure, and kept out of `auth.ts`, so the allowlist is unit-tested without standing up the
 * Worker runtime. Same reason `lib/csv.ts` and `domain/labels.ts` are separate files.
 */

/** The orb's portal proxy. A portal host is one label under this domain. */
export const POLA_PORTAL_ORB = '*.onamp.dev'

/**
 * Is `url` loopback — or unset, which is the same thing here?
 *
 * Unset counts as local: without `BETTER_AUTH_URL` the app cannot be reached at a real
 * domain, so there is no deployment to protect and refusing to run would be worse.
 */
export function urlLokal(url: string | undefined): boolean {
  if (!url) return true
  try {
    const { hostname } = new URL(url)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '[::1]'
    )
  } catch {
    return false
  }
}

/**
 * The `allowedHosts` list for Better Auth's dynamic base URL.
 *
 * `tambahan` is the raw `BETTER_AUTH_ALLOWED_HOSTS` value: comma-separated host patterns,
 * so a preview deployment or a staging domain is configuration rather than a code change.
 */
export function hostDiizinkan(
  url: string | undefined,
  tambahan: string | undefined,
): string[] {
  const eksplisit = (tambahan ?? '')
    .split(',')
    .map((h) => h.trim())
    .filter(Boolean)
  return [...eksplisit, ...(urlLokal(url) ? [POLA_PORTAL_ORB] : [])]
}
