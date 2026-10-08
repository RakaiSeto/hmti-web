import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

import { auth } from '#/lib/auth'

/**
 * Stream the proof photo of a recorded handover or return (FR15, FR16).
 *
 * One route for both because they are the same thing with a different table behind them,
 * and the URL stays symmetric: `/api/bukti/serah/{kode}` and `/api/bukti/kembali/{kode}`.
 * The kind is a two-value union, not a table name off the wire — the query comes from the
 * closed map below, and the request only picks which entry.
 *
 * Staff-only, unlike `/api/foto/$id`: this is the evidence behind a condition recorded at
 * the counter, which is an internal record rather than catalogue data. It re-checks the
 * session itself — a server route sits outside the `/admin` layout's `beforeLoad`, so it
 * inherits none of its protection.
 *
 * `Cache-Control: private, no-store`, same as a letter: a shared cache must never hold it
 * and it must not survive a logout.
 */
const SUMBER = {
  serah: {
    sql: `SELECT t.file_path, t.nama_file FROM serah_terima t
          JOIN pengajuan p ON p.id = t.pengajuan_id WHERE p.kode = ?`,
    tidakAda: 'Serah terima tidak ditemukan',
    bawaan: 'bukti-serah.jpg',
  },
  kembali: {
    sql: `SELECT t.file_path, t.nama_file FROM pengembalian t
          JOIN pengajuan p ON p.id = t.pengajuan_id WHERE p.kode = ?`,
    tidakAda: 'Pengembalian tidak ditemukan',
    bawaan: 'bukti-kembali.jpg',
  },
} as const

export const Route = createFileRoute('/api/bukti/$jenis/$kode')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) {
          return new Response('Tidak berwenang', { status: 401 })
        }

        const sumber =
          params.jenis === 'serah' || params.jenis === 'kembali'
            ? SUMBER[params.jenis]
            : null
        if (!sumber) {
          return new Response('Jenis bukti tidak dikenal', { status: 404 })
        }

        const row = await env.DB.prepare(sumber.sql)
          .bind(params.kode)
          .first<{ file_path: string | null; nama_file: string | null }>()
        if (!row) return new Response(sumber.tidakAda, { status: 404 })
        // Records written before the proof was required have no object behind them.
        if (!row.file_path) {
          return new Response('Bukti tidak ditemukan', { status: 404 })
        }

        const obj = await env.BUCKET.get(row.file_path)
        if (!obj) return new Response('Berkas tidak ditemukan', { status: 404 })

        return new Response(obj.body, {
          headers: {
            'content-type': obj.httpMetadata?.contentType ?? 'image/jpeg',
            'content-disposition': `inline; filename="${row.nama_file ?? sumber.bawaan}"`,
            'cache-control': 'private, no-store',
          },
        })
      },
    },
  },
})
