/**
 * Search-param serialization for the router.
 *
 * TanStack Router's default serializer JSON-encodes any value `JSON.parse` accepts, so a
 * search term like `5` reaches the URL as `q=%225%22` — those quotes are real. It is
 * correct for round-tripping (unquoted `q=5` would come back as the *number* 5 and be
 * dropped by a `typeof === 'string'` check), but it makes a shareable URL noisy.
 *
 * Every param this app uses is a flat string, number or boolean, and each route's
 * `validateSearch` coerces, so a plain string round trip is enough and keeps the URL
 * readable. Booleans go out as `1`/`0` so a route can read them back as strings.
 *
 * Pure, so it is unit-tested in Node like `lib/csv.ts`.
 */

export function parseSearchParams(searchStr: string): Record<string, string> {
  const qs = searchStr.startsWith('?') ? searchStr.slice(1) : searchStr
  const hasil: Record<string, string> = {}
  for (const [k, v] of new URLSearchParams(qs)) hasil[k] = v
  return hasil
}

export function stringifySearchParams(search: Record<string, unknown>): string {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(search)) {
    if (v === undefined || v === null) continue
    p.set(k, v === true ? '1' : v === false ? '0' : String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}
