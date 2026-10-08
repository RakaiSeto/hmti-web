/**
 * Database schema.
 *
 * Phase 0 ships only what authentication needs: the four Better Auth tables plus the
 * `peran` field that carries the app's two roles. The domain tables (kategori, barang,
 * pengajuan, pengajuan_barang, surat, serah_terima, pengembalian, log_aktivitas) land
 * in Phase 1 — see docs/plans/inventory-lending/phase-1-scaffold-data-model.md.
 *
 * The table and column names here are Better Auth's contract, not a style choice; the
 * library looks them up by name. Do not rename without reading its Drizzle adapter.
 */
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

/** The two roles from the v2 requirements. Admin has all rights; PJ is operational. */
export const PERAN = ['admin', 'pj_inventaris'] as const
export type Peran = (typeof PERAN)[number]

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  // FR08: only an admin may create accounts, and only an admin may change a role.
  // `input: false` in lib/auth.ts keeps this off the client-writable surface.
  peran: text('peran', { enum: PERAN }).notNull().default('pj_inventaris'),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  // Cascade: deleting an account revokes its sessions (INV-02's revocation story).
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', {
    mode: 'timestamp',
  }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', {
    mode: 'timestamp',
  }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
})

/* ============================================================================
   Domain tables (Phase 1).

   Conventions that hold everywhere below:
   - `tgl_*` are calendar dates as `YYYY-MM-DD` TEXT, never timestamps. They sort
     correctly as strings, which every range query depends on (decisions.md D10).
   - `waktu` / `created_at` / `updated_at` are real instants: integer unix seconds,
     surfaced as Date. Always UTC; render in Asia/Jakarta.
   - `id` is a text ULID-ish string minted in `src/lib/id.ts`, not an autoincrement:
     ids appear in URLs and logs, and a sequential integer leaks volume.
   ========================================================================== */

/** Item categories (FR10). */
export const kategori = sqliteTable('kategori', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

/** Item condition (FR09). Drives the form's select and the return record. */
export const KONDISI = ['baik', 'rusak_ringan', 'rusak_berat'] as const
export type Kondisi = (typeof KONDISI)[number]

/** Inventory items (FR09). */
export const barang = sqliteTable(
  'barang',
  {
    id: text('id').primaryKey(),
    nama: text('nama').notNull(),
    kategoriId: text('kategori_id')
      .notNull()
      .references(() => kategori.id, { onDelete: 'restrict' }),
    /** Total owned units. Availability is derived from this, never stored. */
    jumlah: integer('jumlah').notNull().default(0),
    kondisi: text('kondisi', { enum: KONDISI }).notNull().default('baik'),
    lokasi: text('lokasi'),
    deskripsi: text('deskripsi'),
    /** R2 object key under `photos/`, or null. */
    fotoPath: text('foto_path'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [index('barang_kategori_idx').on(t.kategoriId)],
)

/**
 * Request status (overview §5). `Terlambat` is NOT here — it is derived at read time
 * from `status === 'Dipinjam' && today > tgl_kembali`, so it can never go stale.
 * The two letter states are on `surat.statusVerifikasi`, not on the request.
 */
export const STATUS_PENGAJUAN = [
  'Diajukan',
  'Disetujui',
  'Ditolak',
  'Dipinjam',
  'Selesai',
  'Dibatalkan',
] as const
export type StatusPengajuan = (typeof STATUS_PENGAJUAN)[number]

/** Borrowing requests (FR03). The borrower is an organisation, not a person. */
export const pengajuan = sqliteTable(
  'pengajuan',
  {
    id: text('id').primaryKey(),
    /** `PINJ-YYYYMM-XXXX`, the only auth on /lacak (FR05). */
    kode: text('kode').notNull().unique(),
    organisasi: text('organisasi').notNull(),
    penanggungJawab: text('penanggung_jawab').notNull(),
    kontak: text('kontak').notNull(),
    /** Inclusive checkout day. */
    tglPinjam: text('tgl_pinjam').notNull(),
    /** Exclusive return day: the item is free again on this date (decisions.md D9). */
    tglKembali: text('tgl_kembali').notNull(),
    keperluan: text('keperluan').notNull(),
    status: text('status', { enum: STATUS_PENGAJUAN })
      .notNull()
      .default('Diajukan'),
    /** Required when status is `Ditolak` (BR06). */
    alasanPenolakan: text('alasan_penolakan'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  },
  (t) => [
    // The availability helper's hot path: status + both date bounds.
    index('pengajuan_status_tgl_idx').on(t.status, t.tglPinjam, t.tglKembali),
  ],
)

/** Request line items — the multi-item table (BR08). */
export const pengajuanBarang = sqliteTable(
  'pengajuan_barang',
  {
    id: text('id').primaryKey(),
    pengajuanId: text('pengajuan_id')
      .notNull()
      .references(() => pengajuan.id, { onDelete: 'cascade' }),
    barangId: text('barang_id')
      .notNull()
      .references(() => barang.id, { onDelete: 'restrict' }),
    jumlah: integer('jumlah').notNull(),
  },
  (t) => [
    index('pengajuan_barang_barang_idx').on(t.barangId),
    index('pengajuan_barang_pengajuan_idx').on(t.pengajuanId),
  ],
)

/**
 * Letter verification state. A *soft* gate in v2 (FR14/BR04): the UI warns but the
 * handover is allowed. `diterima` is what BR02's H-1 rule keys on, not `terverifikasi`.
 */
export const STATUS_SURAT = ['diterima', 'terverifikasi'] as const
export type StatusSurat = (typeof STATUS_SURAT)[number]

/** The physical letter, uploaded by staff (FR13, BR03, NFR03). */
export const surat = sqliteTable('surat', {
  id: text('id').primaryKey(),
  pengajuanId: text('pengajuan_id')
    .notNull()
    .unique()
    .references(() => pengajuan.id, { onDelete: 'cascade' }),
  /** R2 object key under `letters/`. Never public (NFR03). */
  filePath: text('file_path').notNull(),
  namaFile: text('nama_file'),
  statusVerifikasi: text('status_verifikasi', { enum: STATUS_SURAT })
    .notNull()
    .default('diterima'),
  diunggahOleh: text('diunggah_oleh')
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  waktu: integer('waktu', { mode: 'timestamp' }).notNull(),
  diverifikasiOleh: text('diverifikasi_oleh').references(() => user.id, {
    onDelete: 'set null',
  }),
  waktuVerifikasi: integer('waktu_verifikasi', { mode: 'timestamp' }),
})

/** Handover record (FR15). One per request. */
export const serahTerima = sqliteTable('serah_terima', {
  id: text('id').primaryKey(),
  pengajuanId: text('pengajuan_id')
    .notNull()
    .unique()
    .references(() => pengajuan.id, { onDelete: 'cascade' }),
  penerima: text('penerima').notNull(),
  catatan: text('catatan'),
  dicatatOleh: text('dicatat_oleh')
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  waktu: integer('waktu', { mode: 'timestamp' }).notNull(),
})

/** Per-item condition recorded at handover. */
export const serahTerimaItem = sqliteTable('serah_terima_item', {
  id: text('id').primaryKey(),
  serahTerimaId: text('serah_terima_id')
    .notNull()
    .references(() => serahTerima.id, { onDelete: 'cascade' }),
  barangId: text('barang_id')
    .notNull()
    .references(() => barang.id, { onDelete: 'restrict' }),
  kondisi: text('kondisi', { enum: KONDISI }).notNull(),
})

/** What came back for one line (FR16, BR05). `hilang` is separate from `kondisi`. */
export const KONDISI_KEMBALI = ['baik', 'rusak', 'hilang'] as const
export type KondisiKembali = (typeof KONDISI_KEMBALI)[number]

/**
 * Return record (FR16). One per request.
 *
 * `file_path`/`nama_file` are the proof photo (BR05-adjacent): the operator photographs the
 * items as they come back, so a `rusak`/`hilang` line is backed by something a later reader
 * can look at. Nullable in the column, required by `catatPengembalian` — returns recorded
 * before the proof existed are real rows and must not be invalidated by the migration.
 */
export const pengembalian = sqliteTable('pengembalian', {
  id: text('id').primaryKey(),
  pengajuanId: text('pengajuan_id')
    .notNull()
    .unique()
    .references(() => pengajuan.id, { onDelete: 'cascade' }),
  catatan: text('catatan'),
  filePath: text('file_path'),
  namaFile: text('nama_file'),
  dicatatOleh: text('dicatat_oleh')
    .notNull()
    .references(() => user.id, { onDelete: 'restrict' }),
  waktu: integer('waktu', { mode: 'timestamp' }).notNull(),
})

/**
 * Per-item return condition. This is the row the stock recap (INV-23) tallies:
 * `rusak` and `hilang` each reduce the item's `jumlah` inside the same transaction
 * that writes this record (BR05).
 */
export const pengembalianItem = sqliteTable(
  'pengembalian_item',
  {
    id: text('id').primaryKey(),
    pengembalianId: text('pengembalian_id')
      .notNull()
      .references(() => pengembalian.id, { onDelete: 'cascade' }),
    barangId: text('barang_id')
      .notNull()
      .references(() => barang.id, { onDelete: 'restrict' }),
    kondisi: text('kondisi', { enum: KONDISI_KEMBALI }).notNull(),
    jumlah: integer('jumlah').notNull().default(1),
    catatan: text('catatan'),
  },
  (t) => [index('pengembalian_item_barang_idx').on(t.barangId)],
)

/**
 * Append-only activity log (FR21). Written by `logAksi()` at every mutation site.
 * There is deliberately no update or delete path anywhere in the codebase.
 */
export const logAktivitas = sqliteTable(
  'log_aktivitas',
  {
    id: text('id').primaryKey(),
    penggunaId: text('pengguna_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    /** Denormalised so the log survives an account deletion (FR21 is a record). */
    penggunaNama: text('pengguna_nama'),
    aksi: text('aksi').notNull(),
    entitas: text('entitas').notNull(),
    entitasId: text('entitas_id'),
    waktu: integer('waktu', { mode: 'timestamp' }).notNull(),
  },
  (t) => [index('log_waktu_idx').on(t.waktu)],
)
