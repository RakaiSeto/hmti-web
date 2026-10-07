import { describe, expect, it } from 'vitest'

import { hostDiizinkan, POLA_PORTAL_ORB, urlLokal } from './origins'

/**
 * The allowlist decides which origins may call the auth API, so the cases that matter are
 * the ones that must *not* be trusted: a real domain, and anything that is not a URL.
 */
describe('urlLokal', () => {
  it('accepts the loopback hosts a dev server binds to', () => {
    expect(urlLokal('http://localhost:3000')).toBe(true)
    expect(urlLokal('http://127.0.0.1:3000')).toBe(true)
    expect(urlLokal('http://[::1]:3000')).toBe(true)
  })

  it('rejects a deployment origin', () => {
    expect(urlLokal('https://hmti.rakaiseto.com')).toBe(false)
    expect(urlLokal('https://hmti-inventaris.workers.dev')).toBe(false)
  })

  it('treats an unset origin as local, and a malformed one as not', () => {
    expect(urlLokal(undefined)).toBe(true)
    expect(urlLokal('')).toBe(true)
    expect(urlLokal('bukan url')).toBe(false)
  })
})

describe('hostDiizinkan', () => {
  it('allows only the portal in dev, where the base URL is loopback', () => {
    expect(hostDiizinkan('http://localhost:3000', undefined)).toEqual([
      POLA_PORTAL_ORB,
    ])
  })

  it('allows nothing extra on a real deployment', () => {
    expect(hostDiizinkan('https://hmti.rakaiseto.com', undefined)).toEqual([])
  })

  it('passes through the configured hosts, trimmed and without blanks', () => {
    expect(
      hostDiizinkan(
        'https://hmti.rakaiseto.com',
        ' staging.example.com , *.workers.dev ,',
      ),
    ).toEqual(['staging.example.com', '*.workers.dev'])
  })

  it('keeps the portal alongside the configured hosts in dev', () => {
    expect(hostDiizinkan('http://localhost:3000', '*.workers.dev')).toEqual([
      '*.workers.dev',
      POLA_PORTAL_ORB,
    ])
  })
})
