import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

import { auth } from '#/lib/auth'

/**
 * Stream a letter (NFR03).
 *
 * A server route rather than a server function because the browser must be able to open
 * it in a tab, and the response is binary. It re-checks the session itself — a server
 * route is outside the `/admin` layout's `beforeLoad`, so it gets no protection from it.
 *
 * `Cache-Control: private, no-store`: a borrower's letter must never sit in a shared
 * cache, and must not be readable after logout.
 */
export const Route = createFileRoute('/api/surat/$kode')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) {
          return new Response('Tidak berwenang', { status: 401 })
        }

        const row = await env.DB.prepare(
          `SELECT s.file_path, s.nama_file FROM surat s
           JOIN pengajuan p ON p.id = s.pengajuan_id WHERE p.kode = ?`,
        )
          .bind(params.kode)
          .first<{ file_path: string; nama_file: string | null }>()
        if (!row) return new Response('Surat tidak ditemukan', { status: 404 })

        const obj = await env.BUCKET.get(row.file_path)
        if (!obj) return new Response('Berkas tidak ditemukan', { status: 404 })

        return new Response(obj.body, {
          headers: {
            'content-type': obj.httpMetadata?.contentType ?? 'application/pdf',
            'content-disposition': `inline; filename="${row.nama_file ?? 'surat.pdf'}"`,
            'cache-control': 'private, no-store',
          },
        })
      },
    },
  },
})
