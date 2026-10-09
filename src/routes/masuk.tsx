import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useId, useState } from 'react'

import {
  IconArrowLeft,
  IconArrowRight,
  IconEnvelope,
  IconEye,
  IconEyeOff,
  IconLock,
} from '../components/Icons'
import { Logo } from '../components/Logo'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/masuk')({ component: Masuk })

/**
 * 04 · Login Admin (FR07). Serves both roles.
 *
 * The design's structure: logo and heading above the card on the navy gradient, the card
 * holding the fields. There is no self-service sign-up and no self-service reset —
 * accounts are created and reset by an admin (FR08), so the card points at that.
 *
 * Field rows are the design's: 46px tall, `color.surface.container` inside a 1px
 * `color.outline`, `radius.md`, 8px vertical / 12px horizontal padding, an 8px gap, and a
 * leading icon in `neutral.mid`. The trailing eye on the password row is the reveal
 * toggle; it is a button so it never submits the form.
 */
function Masuk() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [lihatSandi, setLihatSandi] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const emailId = useId()
  const sandiId = useId()

  async function kirim(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error: err } = await authClient.signIn.email({ email, password })
      if (err) {
        // 401 is the credentials case, and it is deliberately one message for both "no such
        // account" and "wrong password": distinguishing them tells an attacker which emails
        // are real. Anything else is a fault on our side — a 403 invalid origin, a 5xx — and
        // dressing that up as a wrong password is how a misconfigured auth origin stayed
        // invisible until someone reported "cannot log in".
        setError(
          err.status === 401
            ? 'Email atau kata sandi salah.'
            : 'Terjadi kesalahan pada server. Coba lagi, atau hubungi admin bila berlanjut.',
        )
        return
      }
      await navigate({ to: '/admin/dasbor' })
    } catch {
      // The client returns its failures in `error`; a *thrown* one is the network itself.
      setError(
        'Tidak dapat menghubungi server. Periksa koneksi Anda, lalu coba lagi.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[linear-gradient(135deg,var(--color-ink)_0%,var(--color-accent-firm)_100%)] px-8 py-12">
      <div className="flex w-full max-w-[420px] flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size={64} />
          <h1 className="text-xl font-bold text-neutral-hint">
            Admin &amp; PJ Inventaris
          </h1>
          <p className="text-sm text-brand-soft">
            Masuk untuk mengelola inventaris dan peminjaman.
          </p>
        </div>

        <form
          onSubmit={kirim}
          className="flex w-full flex-col gap-4 rounded-xl bg-surface p-8 shadow-modal"
        >
          <div className="flex flex-col gap-1">
            <label
              htmlFor={emailId}
              className="text-xs font-semibold text-neutral-bold"
            >
              Email Pengurus
            </label>
            <div className="flex h-[46px] items-center gap-2 rounded-md border border-line bg-surface-container px-3 outline-none focus-within:border-accent">
              <IconEnvelope className="shrink-0 text-neutral-mid" />
              <input
                id={emailId}
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-neutral-mid"
                type="email"
                autoComplete="username"
                placeholder="nama@hmti.polinema.ac.id"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor={sandiId}
              className="text-xs font-semibold text-neutral-bold"
            >
              Kata Sandi
            </label>
            <div className="flex h-[46px] items-center gap-2 rounded-md border border-line bg-surface-container px-3 outline-none focus-within:border-accent">
              <IconLock className="shrink-0 text-neutral-mid" />
              <input
                id={sandiId}
                className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-neutral-mid"
                type={lihatSandi ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setLihatSandi((v) => !v)}
                aria-label={
                  lihatSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                }
                className="shrink-0 rounded-sm text-neutral-mid hover:text-text"
              >
                {lihatSandi ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-md bg-error-container px-3 py-2 text-xs font-semibold text-error"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex h-12 items-center justify-center gap-2 rounded-md bg-brand text-md font-semibold text-ink disabled:opacity-60"
          >
            {loading ? 'Memproses…' : 'Masuk ke Dasbor'}
            <IconArrowRight />
          </button>
          <p className="text-xs text-text-soft">
            Lupa kata sandi? Hubungi admin.
          </p>
        </form>

        <a
          href="/"
          className="flex items-center gap-1 text-sm font-semibold text-brand-soft no-underline hover:text-brand"
        >
          <IconArrowLeft size={14} />
          Kembali ke beranda
        </a>
      </div>
    </main>
  )
}
