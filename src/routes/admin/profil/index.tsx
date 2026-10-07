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

      <Card className="flex flex-col gap-4">
        <h2 className="text-md font-semibold text-neutral-intense">
          Nama tampilan
        </h2>
        <div className="max-w-md">
          <Field label="Nama">
            <input
              className={inputCls}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </Field>
        </div>
        <div className="flex justify-end">
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
  )
}

function UbahSandi({ onSukses }: { onSukses: () => void }) {
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [pesan, setPesan] = useState<string | null>(null)
  const [sibuk, setSibuk] = useState(false)

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="text-md font-semibold text-neutral-intense">Kata sandi</h2>
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
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
      </div>
      {pesan ? (
        <p className="text-xs font-semibold text-error">{pesan}</p>
      ) : null}
      <div className="flex justify-end">
        <TombolUtama
          disabled={sibuk || baru.length < 8}
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
            onSukses()
          }}
        >
          Simpan kata sandi
        </TombolUtama>
      </div>
    </Card>
  )
}
