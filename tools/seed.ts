/**
 * Seed the local D1 database with a browsable dataset.
 *
 * Run against the local simulated D1 that `wrangler dev` uses:
 *
 *     bun run db:seed
 *
 * It talks to the SQLite file directly (bun:sqlite) rather than through wrangler, so a
 * seed is one fast process instead of a CLI round trip per statement. It refuses to run
 * against anything but a local file.
 *
 * The dataset is shaped to exercise every phase's verification, not just to look busy:
 * overlapping requests on one item (so the calendar and the conflict check have
 * something to prove), one request per status (so every badge and filter has a row), and
 * a damage record (so BR05's stock adjustment is visible).
 */
import { Database } from 'bun:sqlite'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { hashPassword } from 'better-auth/crypto'

import { newId, newKode } from '../src/lib/id'

const D1_DIR = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'

function findDb(): string {
  const files = readdirSync(D1_DIR)
    .filter((f) => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
    .map((f) => join(D1_DIR, f))
  if (files.length === 0) {
    throw new Error(
      `No local D1 database in ${D1_DIR}. Run \`bun run db:migrate:local\` first.`,
    )
  }
  if (files.length > 1) {
    throw new Error(
      `Several local D1 databases found; refusing to guess:\n  ${files.join('\n  ')}`,
    )
  }
  const f = files[0]
  if (!f.startsWith('.wrangler')) {
    throw new Error(`Refusing to seed a non-local database: ${f}`)
  }
  return f
}

/**
 * Unix SECONDS, matching the `integer(..., { mode: 'timestamp' })` columns.
 *
 * Writing an ISO string here would "work" — SQLite is dynamically typed and stores it —
 * but every read would then do `new Date(string * 1000)` and get `Invalid Date`. That is
 * exactly how the seed first broke the request-detail page.
 */
const detik = () => Math.floor(Date.now() / 1000)
/** `YYYY-MM-DD`, `offset` days from today. */
function hari(offset: number): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

async function main() {
  const path = findDb()
  const db = new Database(path)
  db.exec('PRAGMA foreign_keys = ON')

  console.log(`Seeding ${path} (${Math.round(statSync(path).size / 1024)} KB)`)

  // Idempotent: wipe the domain tables, keep migrations and any real accounts.
  const domainTables = [
    'pengembalian_item',
    'pengembalian',
    'serah_terima_item',
    'serah_terima',
    'surat',
    'pengajuan_barang',
    'pengajuan',
    'log_aktivitas',
    'barang',
    'kategori',
  ]
  for (const t of domainTables) db.exec(`DELETE FROM ${t}`)
  db.exec(`DELETE FROM user WHERE email LIKE '%@hmti.polinema.ac.id'`)

  const now = detik()

  /* --- accounts (FR07, FR08) --------------------------------------------- */
  // disableSignUp is on, so the first accounts are inserted here rather than through a
  // sign-up endpoint. Passwords are hashed with Better Auth's own hasher, so login
  // verifies them through the normal path.
  const adminPass = await hashPassword('admin123')
  const pjPass = await hashPassword('pj123456')

  const adminId = newId()
  const pjId = newId()
  const insUser = db.prepare(
    `INSERT INTO user (id, name, email, email_verified, created_at, updated_at, peran)
     VALUES (?, ?, ?, 1, ?, ?, ?)`,
  )
  insUser.run(
    adminId,
    'Rakai Admin',
    'admin@hmti.polinema.ac.id',
    now,
    now,
    'admin',
  )
  insUser.run(
    pjId,
    'Sinta PJ',
    'pj@hmti.polinema.ac.id',
    now,
    now,
    'pj_inventaris',
  )

  const insAccount = db.prepare(
    `INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
     VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
  )
  insAccount.run(newId(), adminId, adminId, adminPass, now, now)
  insAccount.run(newId(), pjId, pjId, pjPass, now, now)

  /* --- categories and items (FR09, FR10) ---------------------------------- */
  const kategoriIds = new Map<string, string>()
  const insKat = db.prepare(
    `INSERT INTO kategori (id, nama, created_at) VALUES (?, ?, ?)`,
  )
  for (const nama of ['Audio', 'Visual', 'Komputer', 'Perkakas']) {
    const id = newId()
    kategoriIds.set(nama, id)
    insKat.run(id, nama, now)
  }

  const insBarang = db.prepare(
    `INSERT INTO barang (id, nama, kategori_id, jumlah, kondisi, lokasi, deskripsi, foto_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
  )
  const items: Array<[string, string, number, string, string, string]> = [
    [
      'Proyektor Epson EB-X500',
      'Visual',
      4,
      'baik',
      'Gudang TU-2',
      'Proyektor 3600 lumens, HDMI + VGA.',
    ],
    [
      'Proyektor Epson EB-W06',
      'Visual',
      2,
      'baik',
      'Gudang TU-2',
      'Proyektor 3700 lumens, WXGA.',
    ],
    [
      'Kamera Canon EOS M50',
      'Visual',
      3,
      'baik',
      'Lemari Kominfo',
      'Mirrorless + lensa kit 15-45mm.',
    ],
    [
      'Tripod Takara 228',
      'Visual',
      5,
      'baik',
      'Gudang TU-2',
      'Tripod aluminium 150cm.',
    ],
    [
      'Mic Wireless Shure BLX',
      'Audio',
      6,
      'baik',
      'Lemari Audio',
      'Dua mic handheld + receiver.',
    ],
    [
      'Speaker Aktif Yamaha DBR10',
      'Audio',
      4,
      'baik',
      'Gudang TU-2',
      'Speaker aktif 700W.',
    ],
    [
      'Mixer Behringer Xenyx 802',
      'Audio',
      2,
      'rusak_ringan',
      'Lemari Audio',
      'Satu channel fader seret.',
    ],
    ['Kabel XLR 5m', 'Audio', 20, 'baik', 'Lemari Audio', 'Kabel balanced.'],
    [
      'Laptop Asus VivoBook',
      'Komputer',
      3,
      'baik',
      'Sekretariat',
      'Core i5, 8GB RAM.',
    ],
    [
      'Proyektor Screen 70"',
      'Visual',
      2,
      'baik',
      'Gudang TU-2',
      'Layar tripod.',
    ],
    [
      'Tenda Pleton 4x4',
      'Perkakas',
      3,
      'baik',
      'Gudang Bawah',
      'Tenda kegiatan luar ruang.',
    ],
    [
      'Sound System Portable',
      'Audio',
      1,
      'rusak_berat',
      'Gudang TU-2',
      'Menunggu perbaikan.',
    ],
  ]
  const barangIds = new Map<string, string>()
  for (const [nama, kat, jumlah, kondisi, lokasi, deskripsi] of items) {
    const id = newId()
    barangIds.set(nama, id)
    insBarang.run(
      id,
      nama,
      kategoriIds.get(kat)!,
      jumlah,
      kondisi,
      lokasi,
      deskripsi,
      now,
      now,
    )
  }

  /* --- requests (FR03, FR11) ---------------------------------------------- */
  const insPengajuan = db.prepare(
    `INSERT INTO pengajuan (id, kode, organisasi, penanggung_jawab, kontak, tgl_pinjam, tgl_kembali,
                            keperluan, status, alasan_penolakan, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  const insLine = db.prepare(
    `INSERT INTO pengajuan_barang (id, pengajuan_id, barang_id, jumlah) VALUES (?, ?, ?, ?)`,
  )

  interface Spec {
    organisasi: string
    pj: string
    kontak: string
    from: number
    to: number
    keperluan: string
    status: string
    alasan?: string
    /** Pin a tracking code instead of minting a random one — the /lacak demo code. */
    kode?: string
    /**
     * How many days ago it was submitted. Defaults to now, which is what most rows want;
     * the dashboard's "Perlu tindakan" card only lists a request once it has waited more
     * than two days, so at least one pending row has to be older than the seed run.
     */
    dibuat?: number
    lines: Array<[string, number]>
  }

  // A stable code for the first request, so /lacak always has something to look up
  // without grepping the seeded database for a random PINJ- code. Same shape as
  // `newKode`, but the tail is a fixed marker rather than random.
  const bulan = new Date().toISOString().slice(0, 7).replace('-', '')
  const kodeDemo = `PINJ-${bulan}-DEMO`

  const specs: Spec[] = [
    {
      organisasi: 'Workshop Robotika',
      pj: 'Rangga Prasetya',
      kontak: '0812-3456-7890',
      from: 3,
      to: 5,
      keperluan: 'Seminar nasional',
      status: 'Diajukan',
      kode: kodeDemo,
      dibuat: 4,
      lines: [
        ['Proyektor Epson EB-X500', 2],
        ['Kamera Canon EOS M50', 1],
      ],
    },
    {
      organisasi: 'HMJ Teknik Elektro',
      pj: 'Nadia Kusuma',
      kontak: '0813-2222-1111',
      from: 6,
      to: 9,
      keperluan: 'Pelatihan mikrocontroller',
      status: 'Diajukan',
      dibuat: 3,
      lines: [
        ['Proyektor Epson EB-W06', 1],
        ['Kabel XLR 5m', 4],
      ],
    },
    {
      organisasi: 'BEM Polinema',
      pj: 'Fajar Ramadhan',
      kontak: '0857-9999-3333',
      from: 4,
      to: 8,
      keperluan: 'Kegiatan Dies Natalis',
      status: 'Diajukan',
      dibuat: 5,
      lines: [
        ['Speaker Aktif Yamaha DBR10', 2],
        ['Mic Wireless Shure BLX', 2],
      ],
    },
    {
      // Deliberately overlaps the first two on Proyektor EB-X500 and the second on EB-W06.
      organisasi: 'UKM Pramuka',
      pj: 'Dewi Anggraini',
      kontak: '0819-4444-5555',
      from: 4,
      to: 7,
      keperluan: 'Diklat dasar',
      status: 'Disetujui',
      lines: [
        ['Proyektor Epson EB-X500', 1],
        ['Tripod Takara 228', 2],
      ],
    },
    {
      organisasi: 'HMTI Polinema',
      pj: 'Sinta PJ',
      kontak: '0811-7777-8888',
      from: 1,
      to: 3,
      keperluan: 'Rapat kerja pengurus',
      status: 'Disetujui',
      lines: [['Laptop Asus VivoBook', 2]],
    },
    {
      organisasi: 'Komunitas Fotografi',
      pj: 'Bagas Wirawan',
      kontak: '0878-1212-3434',
      from: 2,
      to: 6,
      keperluan: 'Sesi foto profil organisasi',
      status: 'Dipinjam',
      lines: [
        ['Kamera Canon EOS M50', 2],
        ['Tripod Takara 228', 1],
      ],
    },
    {
      // Overdue on purpose, so the Terlambat badge and the dashboard have a case.
      organisasi: 'HMJ Akuntansi',
      pj: 'Ayu Lestari',
      kontak: '0856-3030-4040',
      from: -8,
      to: -2,
      keperluan: 'Lomba debat',
      status: 'Dipinjam',
      lines: [
        ['Mic Wireless Shure BLX', 4],
        ['Speaker Aktif Yamaha DBR10', 1],
      ],
    },
    {
      organisasi: 'UKM Basket',
      pj: 'Rizky Pratama',
      kontak: '0821-5050-6060',
      from: -20,
      to: -14,
      keperluan: 'Turnamen internal',
      status: 'Selesai',
      lines: [
        ['Sound System Portable', 1],
        ['Kabel XLR 5m', 6],
      ],
    },
    {
      organisasi: 'HMJ Administrasi Niaga',
      pj: 'Putri Handayani',
      kontak: '0812-8080-9090',
      from: -12,
      to: -9,
      keperluan: 'Studi banding',
      status: 'Ditolak',
      alasan:
        'Barang yang diminta sedang dipakai untuk kegiatan jurusan pada tanggal tersebut.',
      lines: [['Proyektor Epson EB-X500', 3]],
    },
    {
      organisasi: 'UKM Seni',
      pj: 'Gilang Saputra',
      kontak: '0899-1111-2222',
      from: 12,
      to: 15,
      keperluan: 'Pentas seni',
      status: 'Dibatalkan',
      lines: [['Tenda Pleton 4x4', 2]],
    },
    {
      // Tomorrow with no letter — the BR07 H-1 case the cron should cancel.
      organisasi: 'HMJ Mesin',
      pj: 'Hendra Wijaya',
      kontak: '0817-3333-4444',
      from: 1,
      to: 2,
      keperluan: 'Sosialisasi K3',
      status: 'Disetujui',
      lines: [['Proyektor Epson EB-X500', 1]],
    },
  ]

  const kodeById = new Map<string, string>()
  const idByOrg = new Map<string, string>()
  for (const s of specs) {
    const id = newId()
    const kode = s.kode ?? newKode()
    kodeById.set(kode, id)
    idByOrg.set(s.organisasi, id)
    insPengajuan.run(
      id,
      kode,
      s.organisasi,
      s.pj,
      s.kontak,
      hari(s.from),
      hari(s.to),
      s.keperluan,
      s.status,
      s.alasan ?? null,
      now - (s.dibuat ?? 0) * 86_400,
      now,
    )
    for (const [nama, jumlah] of s.lines) {
      insLine.run(newId(), id, barangIds.get(nama)!, jumlah)
    }
  }

  /* --- letter, handover, return ------------------------------------------ */
  const insSurat = db.prepare(
    `INSERT INTO surat (id, pengajuan_id, file_path, nama_file, status_verifikasi,
                        diunggah_oleh, waktu, diverifikasi_oleh, waktu_verifikasi)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
  // The active loan has a verified letter; the H-1 case deliberately has none.
  const aktif = idByOrg.get('Komunitas Fotografi')!
  insSurat.run(
    newId(),
    aktif,
    'letters/seed-surat-fotografi.pdf',
    'surat-peminjaman.pdf',
    'terverifikasi',
    adminId,
    now,
    adminId,
    now,
  )
  const disetujui = idByOrg.get('UKM Pramuka')!
  insSurat.run(
    newId(),
    disetujui,
    'letters/seed-surat-pramuka.pdf',
    'surat-pramuka.pdf',
    'diterima',
    pjId,
    // Two days ago, so the dashboard's "Perlu tindakan" card has an unverified letter to
    // show — its threshold is one day.
    now - 2 * 86_400,
    null,
    null,
  )

  const insST = db.prepare(
    `INSERT INTO serah_terima (id, pengajuan_id, penerima, catatan, dicatat_oleh, waktu)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  const insSTI = db.prepare(
    `INSERT INTO serah_terima_item (id, serah_terima_id, barang_id, kondisi) VALUES (?, ?, ?, ?)`,
  )
  const stId = newId()
  insST.run(
    stId,
    aktif,
    'Bagas Wirawan',
    'Semua unit lengkap dengan tas dan baterai.',
    pjId,
    now,
  )
  insSTI.run(newId(), stId, barangIds.get('Kamera Canon EOS M50')!, 'baik')
  insSTI.run(newId(), stId, barangIds.get('Tripod Takara 228')!, 'baik')

  /* --- a return that damaged stock, so BR05 is visible (INV-20) ---------- */
  const insKembali = db.prepare(
    `INSERT INTO pengembalian (id, pengajuan_id, catatan, dicatat_oleh, waktu) VALUES (?, ?, ?, ?, ?)`,
  )
  const insKembaliItem = db.prepare(
    `INSERT INTO pengembalian_item (id, pengembalian_id, barang_id, kondisi, jumlah, catatan)
     VALUES (?, ?, ?, ?, ?, ?)`,
  )
  const selesai = idByOrg.get('UKM Basket')!
  const kembId = newId()
  insKembali.run(
    kembId,
    selesai,
    'Satu unit sound system rusak berat.',
    pjId,
    now,
  )
  insKembaliItem.run(
    newId(),
    kembId,
    barangIds.get('Kabel XLR 5m')!,
    'baik',
    6,
    null,
  )
  // A real `rusak` row, not just a note. The stock recap (FR18) tallies damage from these
  // records, so without one the recap's "rusak/hilang" column is always zero and reads as
  // broken. `Sound System Portable` is seeded at jumlah 1, which is this loss already
  // applied — this row is what explains it.
  insKembaliItem.run(
    newId(),
    kembId,
    barangIds.get('Sound System Portable')!,
    'rusak',
    1,
    'Unit tidak menyala, dikirim untuk perbaikan.',
  )

  /* --- activity log (FR21) ----------------------------------------------- */
  const insLog = db.prepare(
    `INSERT INTO log_aktivitas (id, pengguna_id, pengguna_nama, aksi, entitas, entitas_id, waktu)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
  const logRows: Array<[string, string, string, string, string | null]> = [
    [
      adminId,
      'Rakai Admin',
      'menyetujui',
      'pengajuan',
      idByOrg.get('UKM Pramuka')!,
    ],
    [
      adminId,
      'Rakai Admin',
      'menolak',
      'pengajuan',
      idByOrg.get('HMJ Administrasi Niaga')!,
    ],
    [pjId, 'Sinta PJ', 'mencatat_serah_terima', 'pengajuan', aktif],
    [pjId, 'Sinta PJ', 'mencatat_pengembalian', 'pengajuan', selesai],
    [pjId, 'Sinta PJ', 'mengunggah_surat', 'pengajuan', disetujui],
    [adminId, 'Rakai Admin', 'memverifikasi_surat', 'pengajuan', aktif],
  ]
  for (const [uid, nama, aksi, entitas, eid] of logRows) {
    insLog.run(newId(), uid, nama, aksi, entitas, eid, now)
  }

  db.close()

  const counts = {
    kategori: items.length && 4,
    barang: items.length,
    pengajuan: specs.length,
    surat: 2,
  }
  console.log('Seeded:', counts)
  console.log('  admin@hmti.polinema.ac.id / admin123      (admin)')
  console.log('  pj@hmti.polinema.ac.id    / pj123456      (pj_inventaris)')
  console.log(`  /lacak demo code: ${kodeDemo}   (Workshop Robotika, Diajukan)`)
}

await main()
