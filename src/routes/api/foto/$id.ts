import { createFileRoute } from '@tanstack/react-router'
import { env } from 'cloudflare:workers'

/**
 * Serve an item photo (INV-09).
 *
 * Public on purpose: catalog photos are not sensitive, and they are the heaviest thing
 * the public pages fetch. A long immutable cache plus the filename being content-hashed
 * per item id means the browser reuses them freely.
 */
export const Route = createFileRoute('/api/foto/$id')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const row = await env.DB.prepare(
          `SELECT foto_path FROM barang WHERE id = ?`,
        )
          .bind(params.id)
          .first<{ foto_path: string | null }>()
        if (!row?.foto_path) {
          return new Response('Foto tidak ditemukan', { status: 404 })
        }
        const obj = await env.BUCKET.get(row.foto_path)
        if (!obj) return new Response('Berkas tidak ditemukan', { status: 404 })

        return new Response(obj.body, {
          headers: {
            'content-type': obj.httpMetadata?.contentType ?? 'image/jpeg',
            'cache-control': 'public, max-age=3600, s-maxage=86400',
          },
        })
      },
    },
  },
})
