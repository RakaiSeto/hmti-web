import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { Logo } from '../components/Logo'
import { authClient } from '../lib/auth-client'

export const Route = createFileRoute('/masuk')({ component: Masuk })

/**
 * 04 · Login Admin (FR07). Serves both roles.
 *
 * The design's structure: logo and heading above the card on the navy gradient, the card
 * holding the fields. There is no self-service sign-up and no self-service reset —
 * accounts are created and reset by an admin (FR08), so the card points at that.
 */
function Masuk() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function kirim(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = await authClient.signIn.email({ email, password })
    setLoading(false)
    if (err) {
      // Deliberately one message for every failure: distinguishing "no such account"
      // from "wrong password" tells an attacker which emails are real.
      setError('Email atau kata sandi salah.')
      return
    }
    await navigate({ to: '/admin/dasbor' })
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[linear-gradient(135deg,var(--color-ink-firm)_0%,var(--color-accent-firm)_100%)] px-8 py-12">
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
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
            Email Pengurus
            <input
              className="rounded-md border border-neutral-soft bg-surface-container px-3 py-2 text-sm text-text outline-none focus:border-accent"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-neutral-bold">
            Kata Sandi
            <input
              className="rounded-md border border-neutral-soft bg-surface-container px-3 py-2 text-sm text-text outline-none focus:border-accent"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

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
            className="mt-1 rounded-md bg-brand py-2.5 text-md font-semibold text-ink-firm disabled:opacity-60"
          >
            {loading ? 'Memproses…' : 'Masuk ke Dasbor'}
          </button>
          <p className="text-xs text-text-soft">
            Lupa kata sandi? Hubungi admin.
          </p>
        </form>

        <a
          href="/"
          className="text-sm font-semibold text-brand-soft no-underline hover:text-brand"
        >
          ← Kembali ke beranda
        </a>
      </div>
    </main>
  )
}
