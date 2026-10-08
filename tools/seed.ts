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
  for (const nama of ['Audio', 'Visual', 'Komputer', 'Jaringan', 'Perkakas']) {
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
      'Layar Proyektor Tripod 70"',
      'Visual',
      2,
      'baik',
      'Gudang TU-2',
      'Layar tripod, untuk ruang kelas.',
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
    [
      'Proyektor Epson EB-E01',
      'Visual',
      3,
      'baik',
      'Gudang TU-2',
      'Proyektor 3300 lumens, HDMI.',
    ],
    [
      'Proyektor BenQ MX560',
      'Visual',
      2,
      'baik',
      'Gudang TU-2',
      'Proyektor 4000 lumens, XGA.',
    ],
    [
      'Layar Proyektor Tripod 100"',
      'Visual',
      1,
      'baik',
      'Gudang TU-2',
      'Layar tripod ukuran besar, untuk aula.',
    ],
    [
      'Kamera Canon EOS 700D',
      'Visual',
      1,
      'baik',
      'Lemari Kominfo',
      'DSLR + lensa kit 18-55mm.',
    ],
    [
      'Lensa Canon EF 50mm f/1.8',
      'Visual',
      2,
      'baik',
      'Lemari Kominfo',
      'Lensa fixed untuk foto kegiatan indoor.',
    ],
    [
      'Gimbal Zhiyun Smooth 4',
      'Visual',
      2,
      'baik',
      'Lemari Kominfo',
      'Stabilizer untuk perekaman video ponsel.',
    ],
    [
      'Lampu LED Video Godox SL60',
      'Visual',
      2,
      'baik',
      'Lemari Kominfo',
      'Lampu studio 60W + softbox.',
    ],
    [
      'Green Screen 2x3m',
      'Visual',
      1,
      'baik',
      'Gudang Bawah',
      'Kain hijau untuk produksi video.',
    ],
    [
      'Webcam Logitech C920',
      'Visual',
      3,
      'baik',
      'Sekretariat',
      'Webcam 1080p untuk rapat daring.',
    ],
    [
      'Mic Shure SM58',
      'Audio',
      4,
      'baik',
      'Lemari Audio',
      'Mic vokal kabel, konektor XLR.',
    ],
    [
      'Speaker Pasif Yamaha A12',
      'Audio',
      2,
      'baik',
      'Gudang TU-2',
      'Speaker pasif 12 inci, butuh amplifier.',
    ],
    [
      'Mixer Yamaha MG10XU',
      'Audio',
      1,
      'baik',
      'Lemari Audio',
      'Mixer 10 channel dengan efek.',
    ],
    [
      'Amplifier Yamaha PX3',
      'Audio',
      1,
      'baik',
      'Gudang TU-2',
      'Power amplifier 2x300W.',
    ],
    [
      'Kabel Jack 6.3mm 10m',
      'Audio',
      8,
      'baik',
      'Lemari Audio',
      'Kabel instrument, mono.',
    ],
    [
      'Stand Mic Tripod',
      'Audio',
      6,
      'baik',
      'Lemari Audio',
      'Stand mic lipat dengan boom pendek.',
    ],
    [
      'Mic Clip On Wireless',
      'Audio',
      2,
      'baik',
      'Lemari Audio',
      'Mic kerah untuk narasumber.',
    ],
    [
      'DI Box Behringer DI20',
      'Audio',
      2,
      'baik',
      'Lemari Audio',
      'Active DI box, dua channel.',
    ],
    [
      'Laptop Lenovo IdeaPad Slim 3',
      'Komputer',
      2,
      'baik',
      'Sekretariat',
      'Ryzen 5, 16GB RAM, untuk kegiatan lomba.',
    ],
    [
      'Printer Epson L3210',
      'Komputer',
      2,
      'baik',
      'Sekretariat',
      'Printer inkjet all-in-one.',
    ],
    [
      'Monitor LG 24 inci',
      'Komputer',
      2,
      'baik',
      'Sekretariat',
      'Monitor IPS 24 inci, HDMI.',
    ],
    [
      'Keyboard dan Mouse Wireless Logitech',
      'Komputer',
      4,
      'baik',
      'Sekretariat',
      'Set MK235, satu receiver.',
    ],
    [
      'Hard Disk Eksternal 2TB',
      'Komputer',
      2,
      'baik',
      'Sekretariat',
      'Penyimpanan dokumentasi kegiatan.',
    ],
    [
      'SSD Eksternal Samsung T7 1TB',
      'Komputer',
      1,
      'baik',
      'Sekretariat',
      'SSD USB-C untuk transfer berkas besar.',
    ],
    [
      'Router TP-Link Archer C6',
      'Jaringan',
      3,
      'baik',
      'Lemari Jaringan',
      'Router dual band untuk kegiatan lapangan.',
    ],
    [
      'Switch TP-Link 8 Port',
      'Jaringan',
      4,
      'baik',
      'Lemari Jaringan',
      'Switch gigabit unmanaged.',
    ],
    [
      'Access Point Ubiquiti UniFi AC Lite',
      'Jaringan',
      2,
      'baik',
      'Lemari Jaringan',
      'Access point indoor, PoE.',
    ],
    [
      'Kabel UTP Cat6 305m',
      'Jaringan',
      1,
      'baik',
      'Lemari Jaringan',
      'Satu roll, belum dipotong.',
    ],
    [
      'Tang Crimping RJ45',
      'Jaringan',
      3,
      'baik',
      'Lemari Jaringan',
      'Termasuk konektor RJ45 satu pack.',
    ],
    [
      'Tenda Rooftop 3x3',
      'Perkakas',
      2,
      'baik',
      'Gudang Bawah',
      'Tenda kanopi untuk kegiatan luar.',
    ],
    [
      'Kursi Lipat',
      'Perkakas',
      40,
      'baik',
      'Gudang Bawah',
      'Kursi lipat besi, untuk rapat besar.',
    ],
    [
      'Meja Lipat',
      'Perkakas',
      12,
      'baik',
      'Gudang Bawah',
      'Meja lipat 120x60cm.',
    ],
    [
      'Genset 1000W',
      'Perkakas',
      1,
      'baik',
      'Gudang Bawah',
      'Genset bensin, cadangan daya lapangan.',
    ],
    [
      'Kabel Roll 25m',
      'Perkakas',
      4,
      'baik',
      'Gudang Bawah',
      'Kabel roll 4 lubang.',
    ],
    [
      'Tool Kit Lengkap',
      'Perkakas',
      2,
      'baik',
      'Gudang Bawah',
      'Obeng, kunci pas, tang, dan testpen.',
    ],
    [
      'Troli Barang',
      'Perkakas',
      2,
      'baik',
      'Gudang Bawah',
      'Troli lipat untuk angkut peralatan.',
    ],
    [
      'Tangga Aluminium 2m',
      'Perkakas',
      1,
      'baik',
      'Gudang Bawah',
      'Tangga lipat dua sisi.',
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
     * How many days ago it was submitted. Defaults to a week before `from`, which is the
     * relationship the explicit values here follow — a request created after the period it
     * asks for is the one thing that makes a seeded history read as fake. The dashboard's
     * "Perlu tindakan" card only lists a request once it has waited more than two days, so
     * the pending rows state their own age rather than deriving it.
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
    {
      organisasi: 'HMJ Teknik Sipil',
      pj: 'Yusuf Maulana',
      kontak: '0812-1515-2626',
      from: 8,
      to: 11,
      keperluan: 'Kunjungan industri',
      status: 'Diajukan',
      dibuat: 1,
      lines: [
        ['Proyektor Epson EB-E01', 1],
        ['Kabel Roll 25m', 2],
      ],
    },
    {
      organisasi: 'UKM Musik',
      pj: 'Salsabila Rahma',
      kontak: '0857-7171-8282',
      from: 10,
      to: 13,
      keperluan: 'Latihan rutin dan pentas',
      status: 'Diajukan',
      dibuat: 2,
      lines: [
        ['Mixer Yamaha MG10XU', 1],
        ['Mic Shure SM58', 2],
        ['Stand Mic Tripod', 2],
      ],
    },
    {
      organisasi: 'Kelompok Studi Linux',
      pj: 'Rizky Ananda',
      kontak: '0813-9191-0202',
      from: 5,
      to: 7,
      keperluan: 'Pelatihan server',
      status: 'Diajukan',
      dibuat: 3,
      lines: [
        ['Switch TP-Link 8 Port', 2],
        ['Router TP-Link Archer C6', 1],
        ['Kabel UTP Cat6 305m', 1],
      ],
    },
    {
      organisasi: 'Komunitas E-Sport',
      pj: 'Dwi Handoko',
      kontak: '0899-1313-2424',
      from: 25,
      to: 27,
      keperluan: 'Turnamen internal',
      status: 'Diajukan',
      dibuat: 6,
      lines: [
        ['Router TP-Link Archer C6', 1],
        ['Kabel Roll 25m', 2],
      ],
    },
    {
      organisasi: 'LPM Gagasan',
      pj: 'Yoga Pratama',
      kontak: '0812-3535-4646',
      from: 14,
      to: 16,
      keperluan: 'Peliputan kegiatan',
      status: 'Disetujui',
      lines: [
        ['Kamera Canon EOS 700D', 1],
        ['Mic Clip On Wireless', 1],
      ],
    },
    {
      organisasi: 'HMJ Kimia',
      pj: 'Intan Permatasari',
      kontak: '0856-5555-6666',
      from: 7,
      to: 9,
      keperluan: 'Sosialisasi laboratorium',
      status: 'Disetujui',
      lines: [
        ['Proyektor Epson EB-W06', 1],
        ['Layar Proyektor Tripod 70"', 1],
      ],
    },
    {
      organisasi: 'UKM Paduan Suara',
      pj: 'Arif Setiawan',
      kontak: '0821-7777-8888',
      from: 20,
      to: 22,
      keperluan: 'Lomba paduan suara',
      status: 'Disetujui',
      lines: [
        ['Speaker Pasif Yamaha A12', 2],
        ['Amplifier Yamaha PX3', 1],
      ],
    },
    {
      organisasi: 'UKM Voli',
      pj: 'Bayu Nugroho',
      kontak: '0819-9999-0000',
      from: -5,
      to: -1,
      keperluan: 'Turnamen antarkelas',
      status: 'Dipinjam',
      lines: [
        ['Speaker Aktif Yamaha DBR10', 2],
        ['Mic Wireless Shure BLX', 2],
      ],
    },
    {
      organisasi: 'UKM Bela Diri',
      pj: 'Rina Marlina',
      kontak: '0878-1212-3535',
      from: -3,
      to: 2,
      keperluan: 'Latihan bersama',
      status: 'Dipinjam',
      lines: [
        ['Speaker Aktif Yamaha DBR10', 1],
        ['Kabel Jack 6.3mm 10m', 2],
      ],
    },
    {
      organisasi: 'Komunitas Sinematografi',
      pj: 'Citra Ayu',
      kontak: '0813-4646-5757',
      from: -18,
      to: -15,
      keperluan: 'Produksi film pendek',
      status: 'Selesai',
      lines: [
        ['Kamera Canon EOS M50', 2],
        ['Lensa Canon EF 50mm f/1.8', 1],
        ['Tripod Takara 228', 2],
      ],
    },
    {
      organisasi: 'UKM Tari',
      pj: 'Eko Prasetyo',
      kontak: '0857-6868-7979',
      from: -25,
      to: -22,
      keperluan: 'Pentas seni akhir tahun',
      status: 'Selesai',
      lines: [
        ['Speaker Aktif Yamaha DBR10', 2],
        ['Mixer Behringer Xenyx 802', 1],
      ],
    },
    {
      organisasi: 'UKM Catur',
      pj: 'Fitri Wulandari',
      kontak: '0811-9090-1111',
      from: -14,
      to: -11,
      keperluan: 'Turnamen catur antarjurusan',
      status: 'Selesai',
      lines: [
        ['Meja Lipat', 6],
        ['Kursi Lipat', 24],
      ],
    },
    {
      organisasi: 'UKM Pecinta Alam',
      pj: 'Galih Ramadhan',
      kontak: '0821-2222-3333',
      from: -30,
      to: -27,
      keperluan: 'Perkemahan penerimaan anggota',
      status: 'Selesai',
      lines: [
        ['Tenda Pleton 4x4', 3],
        ['Genset 1000W', 1],
      ],
    },
    {
      organisasi: 'UKM Otomotif',
      pj: 'Hana Safitri',
      kontak: '0899-4444-5555',
      from: -9,
      to: -6,
      keperluan: 'Pelatihan perawatan mesin',
      status: 'Ditolak',
      alasan:
        'Genset sedang dijadwalkan perawatan rutin pada tanggal tersebut.',
      lines: [['Genset 1000W', 1]],
    },
    {
      organisasi: 'UKM Kewirausahaan',
      pj: 'Irfan Maulana',
      kontak: '0817-6666-7777',
      from: 30,
      to: 32,
      keperluan: 'Seminar kewirausahaan',
      status: 'Dibatalkan',
      lines: [
        ['Proyektor Epson EB-X500', 1],
        ['Mic Wireless Shure BLX', 2],
      ],
    },
  ]

  const kodeById = new Map<string, string>()
  const idByOrg = new Map<string, string>()
  /** Days ago each request was submitted, resolved once so the log can reuse it. */
  const dibuatHari = new Map<string, number>()
  for (const s of specs) {
    const id = newId()
    const kode = s.kode ?? newKode()
    kodeById.set(kode, id)
    idByOrg.set(s.organisasi, id)
    // A week before the period it asks for, never in the future.
    const hariLalu = s.dibuat ?? Math.max(0, 7 - s.from)
    dibuatHari.set(s.organisasi, hariLalu)
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
      now - hariLalu * 86_400,
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

  /* --- the ordinary handovers and returns --------------------------------- */
  // Every `Dipinjam` request has a handover and every `Selesai` one a return: the status
  // says so, and a request page showing `Dipinjam` with no handover behind it reads as a
  // bug. The two cases above carry the interesting detail — a verified letter, a damage
  // note — and these are the rest, skipped where a case already wrote one.
  //
  // Neither carries a proof photo. The seed writes rows with bun:sqlite and cannot reach
  // R2, so seeded records have `file_path` NULL — the same shape as anything recorded
  // before the proof was required, which the pages already handle.
  const sudahSerahTerima = new Set([aktif])
  const sudahKembali = new Set([selesai])
  for (const s of specs) {
    const pid = idByOrg.get(s.organisasi)!
    if (s.status === 'Dipinjam' && !sudahSerahTerima.has(pid)) {
      const id = newId()
      insST.run(id, pid, s.pj, null, pjId, now)
      for (const [nama] of s.lines) {
        insSTI.run(newId(), id, barangIds.get(nama)!, 'baik')
      }
    }
    if (s.status === 'Selesai' && !sudahKembali.has(pid)) {
      const id = newId()
      insKembali.run(id, pid, 'Semua unit kembali lengkap.', pjId, now)
      for (const [nama, jumlah] of s.lines) {
        insKembaliItem.run(
          newId(),
          id,
          barangIds.get(nama)!,
          'baik',
          jumlah,
          null,
        )
      }
    }
  }

  /* --- activity log (FR21) ----------------------------------------------- */
  const insLog = db.prepare(
    `INSERT INTO log_aktivitas (id, pengguna_id, pengguna_nama, aksi, entitas, entitas_id, waktu)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
  // Derived from the requests rather than hand-listed, so the log agrees with the data
  // above: every decision, handover and return has its entry, and the timestamps run in
  // the order the actions actually happened. Public submissions are not here — they have
  // no account to attribute them to.
  const catatLog = (
    uid: string,
    nama: string,
    aksi: string,
    eid: string,
    waktu: number,
  ) => insLog.run(newId(), uid, nama, aksi, 'pengajuan', eid, waktu)

  // Oldest first, so the log reads in the order the actions happened.
  const urutWaktu = [...specs].sort(
    (a, b) =>
      (dibuatHari.get(b.organisasi) ?? 0) - (dibuatHari.get(a.organisasi) ?? 0),
  )
  for (const s of urutWaktu) {
    const pid = idByOrg.get(s.organisasi)!
    const dibuat = now - (dibuatHari.get(s.organisasi) ?? 0) * 86_400
    if (s.status === 'Ditolak') {
      catatLog(adminId, 'Rakai Admin', 'menolak', pid, dibuat + 3600)
    } else if (s.status === 'Dibatalkan') {
      catatLog(adminId, 'Rakai Admin', 'membatalkan', pid, dibuat + 3600)
    } else if (s.status !== 'Diajukan') {
      catatLog(adminId, 'Rakai Admin', 'menyetujui', pid, dibuat + 3600)
    }
    if (s.status === 'Dipinjam' || s.status === 'Selesai') {
      catatLog(pjId, 'Sinta PJ', 'mencatat_serah_terima', pid, dibuat + 7200)
    }
    if (s.status === 'Selesai') {
      catatLog(pjId, 'Sinta PJ', 'mencatat_pengembalian', pid, dibuat + 86_400)
    }
  }
  catatLog(pjId, 'Sinta PJ', 'mengunggah_surat', disetujui, now - 2 * 86_400)
  catatLog(adminId, 'Rakai Admin', 'memverifikasi_surat', aktif, now - 86_400)

  const counts = {
    kategori: 5,
    barang: items.length,
    pengajuan: specs.length,
    surat: 2,
    serahTerima: db.query('SELECT COUNT(*) AS n FROM serah_terima').get(),
    pengembalian: db.query('SELECT COUNT(*) AS n FROM pengembalian').get(),
    log: db.query('SELECT COUNT(*) AS n FROM log_aktivitas').get(),
  }

  db.close()

  console.log('Seeded:', counts)
  console.log('  admin@hmti.polinema.ac.id / admin123      (admin)')
  console.log('  pj@hmti.polinema.ac.id    / pj123456      (pj_inventaris)')
  console.log(`  /lacak demo code: ${kodeDemo}   (Workshop Robotika, Diajukan)`)
}

await main()
