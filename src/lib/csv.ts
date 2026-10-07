/**
 * CSV generation.
 *
 * Pure, so it lives outside the server modules: a module containing `createServerFn` can
 * only be split into a client stub when *every* export is a server function. A plain
 * helper exported alongside them forces the whole module — bindings included — into the
 * browser bundle.
 *
 * Semicolon-separated, because Indonesian Excel expects `;` and would otherwise put a
 * whole row in one cell.
 */
export function keCsv(head: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v)
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [head, ...rows].map((r) => r.map(esc).join(';')).join('\r\n')
}

/** The BOM is what makes Excel read the file as UTF-8 rather than the system codepage. */
export const BOM_UTF8 = '\uFEFF'
