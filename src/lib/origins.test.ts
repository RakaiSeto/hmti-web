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
  it('allows the configured origin and the portal in dev', () => {
    expect(hostDiizinkan('http://localhost:3000', undefined)).toEqual([
      'localhost:3000',
      POLA_PORTAL_ORB,
    ])
  })

  it('names the deployment origin, so the allowlist is never empty', () => {
    expect(hostDiizinkan('https://hmti.rakaiseto.com', undefined)).toEqual([
      'hmti.rakaiseto.com',
    ])
  })

  it('keeps the port, because that is what a Host header carries', () => {
    expect(hostDiizinkan('https://hmti.rakaiseto.com:8443', undefined)).toEqual(
      ['hmti.rakaiseto.com:8443'],
    )
  })

  it('passes through the configured hosts, trimmed and without blanks', () => {
    expect(
      hostDiizinkan(
        'https://hmti.rakaiseto.com',
        ' staging.example.com , *.workers.dev ,',
      ),
    ).toEqual(['staging.example.com', '*.workers.dev', 'hmti.rakaiseto.com'])
  })

  it('keeps the portal alongside the configured hosts in dev', () => {
    expect(hostDiizinkan('http://localhost:3000', '*.workers.dev')).toEqual([
      '*.workers.dev',
      'localhost:3000',
      POLA_PORTAL_ORB,
    ])
  })

  it('falls back to the portal alone when the origin is unset', () => {
    expect(hostDiizinkan(undefined, undefined)).toEqual([POLA_PORTAL_ORB])
  })

  it('trusts nothing when the origin is malformed', () => {
    expect(hostDiizinkan('bukan url', undefined)).toEqual([])
  })
})
