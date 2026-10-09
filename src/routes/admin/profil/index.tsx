import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import { ubahProfilSendiri } from '../../../server/admin'
import {
  Card,
  Field,
  PageHeader,
  TombolUtama,
  inputCls,
} from '../../../components/ui'

export const Route = createFileRoute('/admin/profil/')({
  component: ProfilSaya,
})

/**
 * 21 · Profil Saya (FR08).
 *
 * Admin-only, per the v2 requirements: an admin edits their own name and password, while
 * a PJ's password is reset by an admin. That is why this route is absent from `NAV_PJ`.
 *
 * The password change goes through Better Auth's own client rather than a server
 * function, so the current password is verified by the library that owns the credential.
 */
function ProfilSaya() {
  const { sesi } = Route.useRouteContext()
  const router = useRouter()
  const [nama, setNama] = useState(sesi.nama)
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)

  if (sesi.peran !== 'admin') {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Profil Saya"
          subtitle="Hubungi admin untuk mengubah data akun Anda."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Profil Saya" subtitle={sesi.email} />

      {pesan ? (
        <p
          role="status"
          className="rounded-md bg-success-container px-4 py-3 text-sm font-semibold text-success-text"
        >
          {pesan}
        </p>
      ) : null}

      {/* Two columns, each card sizing to its own content. The save button sits at the
          card's bottom-left rather than in the right-aligned footer the other forms use. */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-md font-semibold text-neutral-intense">
            Nama tampilan
          </h2>
          <Field label="Nama">
            <input
              maxLength={120}
              className={inputCls}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </Field>
          {/* Read-only, not disabled: the address is the login identity and only an admin
              can change another account's email, so this shows it rather than editing it.
              `readOnly` keeps it focusable and selectable for copying, which `disabled`
              would not. The muted fill is what marks it non-editable — `bg-surface-container`
              is the same value the editable fields use, so it would read as editable. */}
          <Field label="Email">
            <input
              className="cursor-default rounded-md border border-neutral-soft bg-neutral-subtle px-3 py-2 text-sm font-normal text-text-soft outline-none"
              value={sesi.email}
              readOnly
            />
          </Field>
          <div className="mt-2 flex">
            <TombolUtama
              disabled={sibuk || nama.trim().length < 2}
              onClick={async () => {
                setSibuk(true)
                await ubahProfilSendiri({ data: { nama } })
                setSibuk(false)
                setPesan('Nama tersimpan.')
                await router.invalidate()
              }}
            >
              Simpan nama
            </TombolUtama>
          </div>
        </Card>

        <UbahSandi onSukses={() => setPesan('Kata sandi tersimpan.')} />
      </div>
    </div>
  )
}

function UbahSandi({ onSukses }: { onSukses: () => void }) {
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)

  const cocok = baru === konfirmasi

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-md font-semibold text-neutral-intense">Kata sandi</h2>

      {/* One row per field rather than a two-column grid: the card is half-width now, and
          the new password is paired with its confirmation. The current password stays —
          Better Auth's `changePassword` verifies it before accepting the new one. */}
      <div className="flex flex-col gap-4">
        <Field label="Kata sandi saat ini">
          <input
            type="password"
            autoComplete="current-password"
            className={inputCls}
            value={lama}
            onChange={(e) => setLama(e.target.value)}
          />
        </Field>
        <Field label="Kata sandi baru" hint="Minimal 8 karakter.">
          <input
            type="password"
            autoComplete="new-password"
            className={inputCls}
            value={baru}
            onChange={(e) => setBaru(e.target.value)}
          />
        </Field>
        <Field
          label="Konfirmasi kata sandi baru"
          error={konfirmasi && !cocok ? 'Konfirmasi tidak cocok.' : undefined}
        >
          <input
            type="password"
            autoComplete="new-password"
            className={inputCls}
            value={konfirmasi}
            onChange={(e) => setKonfirmasi(e.target.value)}
          />
        </Field>
      </div>

      {pesan ? (
        <p className="text-xs font-semibold text-error">{pesan}</p>
      ) : null}

      <div className="mt-2 flex">
        <TombolUtama
          disabled={sibuk || baru.length < 8 || !cocok}
          onClick={async () => {
            setSibuk(true)
            setPesan(null)
            const { authClient } = await import('../../../lib/auth-client')
            const { error } = await authClient.changePassword({
              currentPassword: lama,
              newPassword: baru,
            })
            setSibuk(false)
            if (error) {
              setPesan('Kata sandi saat ini salah.')
              return
            }
            setLama('')
            setBaru('')
            setKonfirmasi('')
            onSukses()
          }}
        >
          Simpan kata sandi
        </TombolUtama>
      </div>
    </Card>
  )
}
