/**
 * Client-side list fetching — the "AJAX table" shape.
 *
 * The route loader still supplies the first page, so the initial paint is server-rendered;
 * after mount the list owns its own state. A filter, sort, page or page-size change
 * refetches through the server function and swaps the table in place, leaving the URL
 * untouched. The trade for that is deep links and the back button: a refresh starts over
 * from the defaults.
 *
 * Responses are guarded by a request counter, so a slow first request cannot overwrite the
 * result of a faster second one.
 */
import { useCallback, useRef, useState } from 'react'

export interface Daftar<THasil, TParams> {
  /** The params of the last request, so handlers can build the next one. */
  params: TParams
  hasil: THasil
  /** A request is in flight. */
  sibuk: boolean
  /** The last request failed. */
  galat: string | null
  /** Replace the params and refetch. */
  muat: (next: TParams) => void
}

export function useDaftar<THasil extends { rows: unknown[] }, TParams>(
  fetcher: (args: { data: TParams }) => Promise<THasil>,
  awal: THasil,
  params0: TParams,
): Daftar<THasil, TParams> {
  const [params, setParams] = useState<TParams>(params0)
  const [hasil, setHasil] = useState<THasil>(awal)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const urut = useRef(0)

  const muat = useCallback(
    (next: TParams) => {
      setParams(next)
      const id = ++urut.current
      setSibuk(true)
      setGalat(null)
      void fetcher({ data: next })
        .then((h) => {
          if (id !== urut.current) return
          setHasil(h)
        })
        .catch((e: unknown) => {
          if (id !== urut.current) return
          setGalat(e instanceof Error ? e.message : 'Gagal memuat data.')
        })
        .finally(() => {
          if (id === urut.current) setSibuk(false)
        })
    },
    [fetcher],
  )

  return { params, hasil, sibuk, galat, muat }
}
