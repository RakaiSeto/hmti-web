import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

import { auth } from '#/lib/auth'

/**
 * Stream the proof photo of a recorded return (FR16).
 *
 * Staff-only, unlike `/api/foto/$id`: this is the evidence behind a `rusak`/`hilang` line,
 * which is an internal record rather than catalogue data, and it can show the inside of a
 * borrower's kit. It re-checks the session itself — a server route sits outside the
 * `/admin` layout's `beforeLoad`, so it inherits none of its protection.
 *
 * `Cache-Control: private, no-store`, same as a letter: a shared cache must never hold it
 * and it must not survive a logout.
 */
export const Route = createFileRoute('/api/bukti/$kode')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) {
          return new Response('Tidak berwenang', { status: 401 })
        }

        const row = await env.DB.prepare(
          `SELECT pk.file_path, pk.nama_file FROM pengembalian pk
           JOIN pengajuan p ON p.id = pk.pengajuan_id WHERE p.kode = ?`,
        )
          .bind(params.kode)
          .first<{ file_path: string | null; nama_file: string | null }>()
        if (!row)
          return new Response('Pengembalian tidak ditemukan', { status: 404 })
        // Returns recorded before the proof was required have no object behind them.
        if (!row.file_path) {
          return new Response('Bukti tidak ditemukan', { status: 404 })
        }

        const obj = await env.BUCKET.get(row.file_path)
        if (!obj) return new Response('Berkas tidak ditemukan', { status: 404 })

        return new Response(obj.body, {
          headers: {
            'content-type': obj.httpMetadata?.contentType ?? 'image/jpeg',
            'content-disposition': `inline; filename="${row.nama_file ?? 'bukti.jpg'}"`,
            'cache-control': 'private, no-store',
          },
        })
      },
    },
  },
})
