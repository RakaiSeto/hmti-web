import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { statusDari } from '../../domain/ketersediaan'
import { formatTanggal, todayWib } from '../../lib/dates'
import {
  daftarBarangUntukForm,
  daftarKategoriPublik,
} from '../../server/katalog'
import { cekKetersediaan, kirimPengajuan } from '../../server/pengajuan'
import { PublicTopbar } from '../../components/PublicTopbar'
import { AvailabilityBadge } from '../../components/StatusBadge'
import {
  Card,
  Field,
  PageHeader,
  TombolSekunder,
  TombolUtama,
  inputCls,
} from '../../components/ui'

export const Route = createFileRoute('/ajukan/')({
  validateSearch: (s: Record<string, unknown>): { barang?: string } => ({
    barang: typeof s.barang === 'string' ? s.barang : undefined,
  }),
  loaderDeps: ({ search }) => ({ barang: search.barang ?? '' }),
  loader: async ({ deps }) => ({
    kategori: await daftarKategoriPublik(),
    barang: await daftarBarangUntukForm(),
    preselect: deps.barang,
  }),
  component: FormPeminjaman,
})

interface Baris {
  barangId: string
  jumlah: number
}

/**
 * 02 · Form Peminjaman (FR03, FR04).
 *
 * The catalog lives *inside* this form — search, category chips, availability badges and
 * add/remove lines — rather than as a separate public page, which is the correction
 * design-pages-plan §9.2 records. Client-side checks are convenience only: the server
 * re-validates every field and re-runs the availability check inside the insert.
 */
function FormPeminjaman() {
  const { barang, kategori, preselect } = Route.useLoaderData()
  const router = useRouter()

  const [organisasi, setOrganisasi] = useState('')
  const [penanggungJawab, setPenanggungJawab] = useState('')
  const [kontak, setKontak] = useState('')
  const [keperluan, setKeperluan] = useState('')
  const [tglPinjam, setTglPinjam] = useState(todayWib())
  const [tglKembali, setTglKembali] = useState('')
  const [cari, setCari] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [baris, setBaris] = useState<Baris[]>(
    preselect ? [{ barangId: preselect, jumlah: 1 }] : [],
  )
  const [pesan, setPesan] = useState<string | null>(null)
  const [kurang, setKurang] = useState<
    Array<{ namaBarang: string; diminta: number; tersedia: number }>
  >([])
  const [sibuk, setSibuk] = useState(false)
  const [kode, setKode] = useState<string | null>(null)

  // Availability for the chosen window, recomputed whenever it changes. This goes
  // through a server function: reading the D1 binding from component code would pull a
  // Worker-only module into the browser bundle.
  const [tersediaMap, setTersediaMap] = useState<Record<string, number>>({})
  useEffect(() => {
    if (!tglKembali || tglKembali <= tglPinjam) {
      setTersediaMap({})
      return
    }
    // An AbortController rather than a boolean flag: the flag is only ever set in the
    // cleanup, so a plain `let` reads as a constant to the type checker and to a reader.
    const ctrl = new AbortController()
    void (async () => {
      const hasil = await cekKetersediaan({
        data: {
          mulai: tglPinjam,
          selesai: tglKembali,
          barangIds: barang.map((b) => b.id),
        },
      })
      // The window changed while this was in flight; a stale answer must not land.
      if (!ctrl.signal.aborted) setTersediaMap(hasil)
    })()
    return () => ctrl.abort()
  }, [tglPinjam, tglKembali, barang])

  const terlihat = barang.filter((b) => {
    if (filterKategori && b.kategoriId !== filterKategori) return false
    if (
      cari.trim() &&
      !b.nama.toLowerCase().includes(cari.trim().toLowerCase())
    )
      return false
    return true
  })

  function tambah(id: string) {
    setBaris((s) =>
      s.some((b) => b.barangId === id)
        ? s
        : [...s, { barangId: id, jumlah: 1 }],
    )
  }

  async function kirim() {
    setSibuk(true)
    setPesan(null)
    setKurang([])
    const hasil = await kirimPengajuan({
      data: {
        organisasi,
        penanggungJawab,
        kontak,
        tglPinjam,
        tglKembali,
        keperluan,
        baris,
      },
    })
    setSibuk(false)
    if (!hasil.ok) {
      setPesan(hasil.pesan ?? 'Pengajuan tidak dapat diproses.')
      setKurang(hasil.kekurangan ?? [])
      return
    }
    setKode(hasil.kode!)
    await router.invalidate()
  }

  if (kode) {
    return (
      <div className="flex min-h-dvh flex-col">
        <PublicTopbar />
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 px-8 py-12">
          <Card className="flex flex-col gap-4 text-center">
            <h1 className="text-xl font-bold text-neutral-intense">
              Pengajuan terkirim
            </h1>
            <p className="text-sm text-text-soft">
              Simpan kode ini untuk mengecek status pengajuan Anda.
            </p>
            <p className="rounded-md bg-surface-container py-4 font-mono text-lg font-bold tracking-wide text-neutral-intense">
              {kode}
            </p>
            <p className="text-xs text-text-soft">
              Status tidak dikirim melalui email. Gunakan halaman Cek Status
              dengan kode di atas.
            </p>
            <div className="flex justify-center gap-2">
              <a
                href={`/lacak?kode=${kode}`}
                className="rounded-md bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink no-underline"
              >
                Cek status
              </a>
              <TombolSekunder
                onClick={() => void navigator.clipboard.writeText(kode)}
              >
                Salin kode
              </TombolSekunder>
            </div>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicTopbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-8 py-6">
        <PageHeader
          title="Formulir Peminjaman"
          subtitle="Lengkapi data berikut. Admin akan meninjau pengajuan Anda maksimal 1×24 jam."
        />

        {pesan ? (
          <div
            role="alert"
            className="rounded-md bg-error-container px-4 py-3 text-sm font-semibold text-error"
          >
            <p>{pesan}</p>
            {kurang.length > 0 ? (
              <ul className="mt-2 list-inside list-disc font-normal">
                {kurang.map((k) => (
                  <li key={k.namaBarang}>
                    {k.namaBarang}: diminta {k.diminta}, tersedia {k.tersedia}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <h2 className="text-md font-semibold text-neutral-intense">
                Data Organisasi
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nama organisasi">
                  <input
                    className={inputCls}
                    placeholder="mis. Workshop Robotika"
                    value={organisasi}
                    onChange={(e) => setOrganisasi(e.target.value)}
                  />
                </Field>
                <Field label="Nama penanggung jawab">
                  <input
                    className={inputCls}
                    value={penanggungJawab}
                    onChange={(e) => setPenanggungJawab(e.target.value)}
                  />
                </Field>
                <Field label="No. WhatsApp">
                  <input
                    className={inputCls}
                    placeholder="0812-3456-7890"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                  />
                </Field>
                <Field label="Keperluan">
                  <input
                    className={inputCls}
                    placeholder="mis. Seminar nasional"
                    value={keperluan}
                    onChange={(e) => setKeperluan(e.target.value)}
                  />
                </Field>
                <Field label="Tanggal pinjam">
                  <input
                    type="date"
                    min={todayWib()}
                    className={inputCls}
                    value={tglPinjam}
                    onChange={(e) => setTglPinjam(e.target.value)}
                  />
                </Field>
                <Field
                  label="Tanggal kembali"
                  hint="Barang dapat dipinjam kembali oleh organisasi lain pada tanggal ini."
                >
                  <input
                    type="date"
                    min={tglPinjam}
                    className={inputCls}
                    value={tglKembali}
                    onChange={(e) => setTglKembali(e.target.value)}
                  />
                </Field>
              </div>
            </Card>

            <Card className="flex flex-col gap-4">
              <h2 className="text-md font-semibold text-neutral-intense">
                Pilih barang
              </h2>
              <input
                className={inputCls}
                placeholder="Cari barang…"
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setFilterKategori('')}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    filterKategori === ''
                      ? 'border-accent bg-accent text-white'
                      : 'border-neutral-soft text-text-soft'
                  }`}
                >
                  Semua
                </button>
                {kategori.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setFilterKategori(k.id)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      filterKategori === k.id
                        ? 'border-accent bg-accent text-white'
                        : 'border-neutral-soft text-text-soft'
                    }`}
                  >
                    {k.nama}
                  </button>
                ))}
              </div>

              <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
                {terlihat.map((b) => {
                  const bebas = tersediaMap[b.id] ?? b.jumlah
                  const sudah = baris.some((x) => x.barangId === b.id)
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-neutral-soft px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-neutral-intense">
                          {b.nama}
                        </p>
                        <p className="text-xs text-text-soft">
                          {b.kategoriNama} · {bebas} dari {b.jumlah} unit bebas
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <AvailabilityBadge
                          status={statusDari(bebas, b.jumlah)}
                        />
                        <button
                          type="button"
                          disabled={sudah || bebas <= 0}
                          onClick={() => tambah(b.id)}
                          className="rounded-md border border-neutral-soft px-3 py-1 text-xs font-semibold disabled:opacity-40"
                        >
                          {sudah ? 'Ditambah' : 'Tambah'}
                        </button>
                      </div>
                    </div>
                  )
                })}
                {terlihat.length === 0 ? (
                  <p className="py-6 text-center text-sm text-text-soft">
                    Tidak ada barang yang cocok.
                  </p>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-3">
              <h2 className="text-md font-semibold text-neutral-intense">
                Keranjang ({baris.length})
              </h2>
              {baris.length === 0 ? (
                <p className="text-sm text-text-soft">
                  Belum ada barang dipilih.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {baris.map((x) => {
                    const b = barang.find((y) => y.id === x.barangId)!
                    const bebas = tersediaMap[b.id] ?? b.jumlah
                    return (
                      <li key={x.barangId} className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-semibold text-neutral-intense">
                            {b.nama}
                          </span>
                          <button
                            type="button"
                            className="text-xs font-semibold text-error"
                            onClick={() =>
                              setBaris((s) =>
                                s.filter((y) => y.barangId !== x.barangId),
                              )
                            }
                          >
                            Hapus
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Kurangi ${b.nama}`}
                            className="size-7 rounded-md border border-neutral-soft text-sm"
                            onClick={() =>
                              setBaris((s) =>
                                s.map((y) =>
                                  y.barangId === x.barangId
                                    ? {
                                        ...y,
                                        jumlah: Math.max(1, y.jumlah - 1),
                                      }
                                    : y,
                                ),
                              )
                            }
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {x.jumlah}
                          </span>
                          <button
                            type="button"
                            aria-label={`Tambah ${b.nama}`}
                            className="size-7 rounded-md border border-neutral-soft text-sm"
                            onClick={() =>
                              setBaris((s) =>
                                s.map((y) =>
                                  y.barangId === x.barangId
                                    ? {
                                        ...y,
                                        jumlah: Math.min(bebas, y.jumlah + 1),
                                      }
                                    : y,
                                ),
                              )
                            }
                          >
                            +
                          </button>
                          <span className="text-xs text-text-soft">
                            maks {bebas}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              {!tglKembali || tglKembali <= tglPinjam ? (
                <p className="rounded-md bg-warning-container px-3 py-2 text-xs font-semibold text-warning">
                  Pilih tanggal kembali untuk melihat ketersediaan pada rentang
                  tersebut.
                </p>
              ) : (
                <p className="text-xs text-text-soft">
                  Ketersediaan dihitung untuk {formatTanggal(tglPinjam)} →{' '}
                  {formatTanggal(tglKembali)}.
                </p>
              )}

              <TombolUtama
                disabled={
                  sibuk ||
                  baris.length === 0 ||
                  organisasi.trim().length < 2 ||
                  penanggungJawab.trim().length < 2 ||
                  kontak.trim().length < 8 ||
                  keperluan.trim().length < 3 ||
                  !tglKembali ||
                  tglKembali <= tglPinjam
                }
                onClick={() => void kirim()}
              >
                {sibuk ? 'Mengirim…' : 'Kirim pengajuan'}
              </TombolUtama>
              <p className="text-xs text-text-soft">
                Tanpa akun — cukup data organisasi. Anda akan menerima kode
                pelacakan.
              </p>
            </Card>

            <Card className="flex flex-col gap-2">
              <h2 className="text-md font-semibold text-neutral-intense">
                Butuh lihat semua?
              </h2>
              <p className="text-sm text-text-soft">
                Katalog lengkap dengan kalender ketersediaan per barang.
              </p>
              <a
                href="/katalog"
                className="text-sm font-semibold text-accent no-underline hover:underline"
              >
                Lihat katalog lengkap →
              </a>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
