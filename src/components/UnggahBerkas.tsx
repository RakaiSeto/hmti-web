/**
 * The upload field: a dashed drop zone you can click, or drop a file onto.
 *
 * Ported from the design system's `.upload` block (`design-system/app.css` and the frame at
 * `design-system/index.html` §"Surat permohonan"): a 1.5px dashed border, a glyph, "Tarik
 * berkas ke sini / atau pilih dari perangkat", the accepted types and size, and a "Pilih
 * berkas" affordance.
 *
 * It is a **picker, not an uploader**. The caller owns the picked `File` and decides what
 * happens next, because the three fields that use it differ: an item photo and a letter are
 * uploaded the moment one is picked, while a return's proof photo is held until the whole
 * form is submitted.
 *
 * Meant to be rendered inside `Field`, which is a `<label>`. The zone is therefore a plain
 * `<div>` and the file input lives inside it, so a click anywhere in the zone opens the
 * file manager through the label's own behaviour rather than a second click handler on the
 * div — which also means no nested `<label>`, and no `<button>` competing with the label's
 * labelled control. The input is visually hidden but focusable, so the zone draws the focus
 * ring with `focus-within`.
 */
import { useEffect, useRef, useState } from 'react'

import { cocokTerima, ukuranBerkas } from '../domain/unggahan'
import { IconCamera, IconUnggah } from './Icons'

export interface UnggahBerkasProps {
  /** The input's `accept` list, e.g. `image/jpeg,image/png`. Enforced on drop too. */
  accept: string
  /** The types and size limit, shown under the prompt — the design's second line. */
  petunjuk: string
  /** The picked file, or null. */
  file: File | null
  /** A file was picked or dropped. The caller decides what happens next. */
  onPilih: (file: File) => void
  /** An upload is in flight: the zone goes inert and says so. */
  sibuk?: boolean
  /**
   * URL of an already-stored image, shown when nothing is picked. Omit for a field whose
   * stored file is described elsewhere on the page, as a letter's is.
   */
  gambarTersimpan?: string | null
  /**
   * Offer a second, camera-only affordance next to the picker. Only for image-only fields:
   * a field that also takes a PDF would lose the file manager to the camera on a phone.
   * The zone itself still opens the file manager, so a stored photo can be chosen too.
   */
  kamera?: boolean
}

/**
 * An object URL for the picked file, revoked when the file changes or the field unmounts.
 *
 * Derived state rather than a ref the caller has to clear: the URL's lifetime is exactly
 * the file's.
 */
function usePratinjau(file: File | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const dibuat = URL.createObjectURL(file)
    setUrl(dibuat)
    return () => URL.revokeObjectURL(dibuat)
  }, [file])
  return url
}

export function UnggahBerkas({
  accept,
  petunjuk,
  file,
  onPilih,
  sibuk = false,
  gambarTersimpan = null,
  kamera = false,
}: UnggahBerkasProps) {
  const [diAtas, setDiAtas] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const refKamera = useRef<HTMLInputElement>(null)
  const pratinjau = usePratinjau(file)

  function terima(berkas: File) {
    if (!cocokTerima(accept, berkas)) {
      setGalat(`Jenis berkas tidak didukung. ${petunjuk}`)
      return
    }
    setGalat(null)
    onPilih(berkas)
  }

  /** Both inputs — the picker and the camera — hand their file through here. */
  function dariInput(e: React.ChangeEvent<HTMLInputElement>) {
    const dipilih = e.target.files?.[0]
    if (dipilih) terima(dipilih)
    // Cleared so picking the same file twice still fires a change.
    e.target.value = ''
  }

  const zona = [
    'flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed px-6 py-7 text-center transition-colors',
    sibuk
      ? 'pointer-events-none border-neutral-soft bg-surface-container/60 opacity-60'
      : diAtas
        ? 'border-accent bg-accent-container/40'
        : 'border-line bg-surface hover:border-accent hover:bg-accent-container/20 focus-within:border-accent',
  ].join(' ')

  const gambar = file
    ? file.type.startsWith('image/')
      ? pratinjau
      : null
    : gambarTersimpan

  return (
    <>
      <div
        className={zona}
        onDragOver={(e) => {
          if (sibuk) return
          e.preventDefault()
          setDiAtas(true)
        }}
        onDragLeave={(e) => {
          // `dragleave` also fires when the pointer crosses into one of the zone's own
          // children; only a departure from the zone itself ends the highlight.
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
          setDiAtas(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setDiAtas(false)
          if (sibuk) return
          // `item()` rather than `[0]`: it is typed `File | null`, which is what a drop
          // with no file actually gives (a dragged link, say).
          const jatuh = e.dataTransfer.files.item(0)
          if (jatuh) terima(jatuh)
        }}
      >
        <input
          type="file"
          accept={accept}
          disabled={sibuk}
          className="sr-only"
          onChange={dariInput}
        />
        {kamera ? (
          <input
            ref={refKamera}
            type="file"
            accept={accept}
            capture="environment"
            disabled={sibuk}
            aria-label="Ambil foto"
            className="sr-only"
            onChange={dariInput}
          />
        ) : null}
        <IconUnggah size={26} className="text-text-soft" />
        <p className="text-sm text-text-soft">
          <span className="font-semibold text-neutral-intense">
            {sibuk ? 'Mengunggah…' : 'Tarik berkas ke sini'}
          </span>
          {sibuk ? null : ' atau pilih dari perangkat.'}
        </p>
        <p className="text-sm text-text-soft">{petunjuk}</p>
        {/* The zone itself is the control, so "Pilih berkas" is the design's button drawn
            as an affordance rather than a second interactive element. "Ambil foto" is a
            real button on purpose: a nested interactive element does not trigger the
            label, so it opens the camera input without also opening the file manager. */}
        <span className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="rounded-md border border-neutral-soft bg-surface px-3 py-1.5 text-sm font-semibold text-neutral-intense"
          >
            Pilih berkas
          </span>
          {kamera ? (
            <button
              type="button"
              disabled={sibuk}
              onClick={() => refKamera.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-soft bg-surface px-3 py-1.5 text-sm font-semibold text-neutral-intense disabled:opacity-60"
            >
              <IconCamera size={16} />
              Ambil foto
            </button>
          ) : null}
        </span>
      </div>

      {galat ? (
        <p role="alert" className="text-xs font-semibold text-error">
          {galat}
        </p>
      ) : null}

      {file ? (
        <div className="flex items-center gap-3 rounded-md border border-line bg-surface p-2.5">
          {gambar ? (
            <img
              src={gambar}
              alt=""
              className="h-14 w-14 shrink-0 rounded-sm object-cover"
            />
          ) : null}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-neutral-intense">
              {file.name}
            </span>
            <span className="block text-sm text-text-soft">
              {ukuranBerkas(file.size)}
            </span>
          </span>
        </div>
      ) : gambarTersimpan ? (
        <img
          src={gambarTersimpan}
          alt=""
          className="h-32 w-32 rounded-md object-cover"
        />
      ) : null}
    </>
  )
}
