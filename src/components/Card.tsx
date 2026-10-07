/**
 * A card, per the design.
 *
 * Every card in the canvas carries the same recipe: `color.surface` fill, `radius.xl`,
 * and a *pair* of stacked shadows (`y1/blur2 @0.1` + `y8/blur24 @0.2`). The fill is
 * nearly identical to the page background in light mode, so the shadow pair is what
 * actually separates a card from the page — dropping it makes the card vanish.
 *
 * `p-4` is the design's 16px card padding (frame 03 "Lacak pengajuan", frame 11
 * "Organisasi"). Pass a different padding via `className` where a card is roomier.
 */
export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-xl bg-surface p-4 shadow-card ${className}`}>
      {children}
    </div>
  )
}
