#!/usr/bin/env python3
"""Generate src/styles/tokens.css from the values the Brilliant design actually uses.

Reads the MCP blueprint dumps (read full) and emits a Tailwind v4 @theme block plus
light / dark / high-contrast overrides. Values are harvested, never invented; each
line carries the design token name it came from so drift is traceable.
"""
import re
import collections
import pathlib

SOURCES = ["/tmp/full.txt", "/tmp/kitfull.txt", "/tmp/d3.txt", "/tmp/init2.txt"]
TOK = re.compile(r"tok\(([a-zA-Z0-9._-]+),((?:[^()]|\([^()]*\))*)\)")

# design token name -> (tailwind var name, css var name)
# Tailwind v4 namespaces: color, font, text, spacing, radius, tracking, leading
COLOR_MAP = {
    # brand yellow (design: primary.*)
    "primary.mid": "brand",
    "primary.firm": "brand-firm",
    "primary.soft": "brand-soft",
    "primary.hint": "brand-hint",
    # brand blue (design: secondary.*)
    "secondary.mid": "accent",
    "secondary.firm": "accent-firm",
    "secondary.soft": "accent-soft",
    "secondary.container": "accent-container",
    "color.secondary": None,  # duplicate of secondary.mid, skip
    # deep navy (design: tertiary.*) — the sidebar
    "tertiary.mid": "ink",
    "tertiary.firm": "ink-firm",
    # neutrals
    "neutral.intense": "neutral-intense",
    "neutral.bold": "neutral-bold",
    "neutral.mid": "neutral-mid",
    "neutral.soft": "neutral-soft",
    "neutral.subtle": "neutral-subtle",
    "neutral.hint": "neutral-hint",
    # surfaces and text
    # NOTE the direction: the design's page is `color.surface.container` and its cards are
    # `color.surface` — the card is very slightly *darker* than the page in light mode
    # (#EFF0F2 on #F0F0F0) and clearly darker in dark mode (#292929 on #373737). Cards are
    # separated by the shadow pair below, not by their fill. Naming them the other way
    # round ("raised") is what made a card invisible the first time.
    "color.surface.container": "surface-container",
    "color.surface": "surface",
    "color.text.primary": "text",
    "color.text.secondary": "text-soft",
    "color.text.disabled": "text-disabled",
    # lines
    "color.outline": "line",
    "color.outline.variant": "line-soft",
    # status
    "color.success": "success",
    "color.success.container": "success-container",
    "color.success.text": "success-text",
    "color.warning": "warning",
    "color.warning.container": "warning-container",
    "color.error": "error",
    "color.error.container": "error-container",
    "color.info": "info",
    "color.info.container": "info-container",
    "color.shadow": "shadow",
}

# Tokens that exist only as editor chrome (component-boundary guides), never design content.
EXCLUDE = {"indigo"}

SPACING = {"none": "0", "xs": "4px", "sm": "8px", "md": "12px", "lg": "16px",
           "xl": "24px", "2xl": "32px"}
RADIUS = {"xs": "2px", "sm": "4px", "md": "6px", "lg": "8px", "xl": "12px",
          "2xl": "16px", "full": "9999px"}
FONT_SIZE = {"xs": "12px", "sm": "14px", "md": "16px", "lg": "20px", "xl": "24px",
             "2xl": "32px", "4xl": "40px"}
LEADING = {"tight": "1.2", "base": "1.21", "normal": "1.22", "snug": "1.23",
           "relaxed": "1.25"}

# Shadows. Tailwind has no equivalent of these, so unlike spacing and radius they have to
# be emitted. Both are read straight off the design:
#   - a card carries a PAIR — the design stacks `y1/blur2 @0.1` and `y8/blur24 @0.2`
#     (frame 11 "Organisasi", frame 03 "Lacak pengajuan", and every other card);
#   - a card floating over a dark backdrop, like the login card, uses a single doubled
#     shadow `y16/blur48 @0.2` (frame 04).
# Colour is `color.shadow` #141414 = rgb(20 20 20).
SHADOWS = {
    "card": "0 1px 2px rgb(20 20 20 / 0.1), 0 8px 24px rgb(20 20 20 / 0.2)",
    "modal": "0 16px 48px rgb(20 20 20 / 0.2)",
}


def harvest():
    txt = "".join(pathlib.Path(p).read_text(errors="replace") for p in SOURCES)
    rec = collections.OrderedDict()
    for m in TOK.finditer(txt):
        name, body = m.group(1), m.group(2)
        if name in EXCLUDE:
            continue
        r = rec.setdefault(name, {"light": set(), "dark": set(), "hc": set()})
        r["light"].add(body.split(",")[0].strip())
        d = re.search(r"dark\(([^)]*)\)", body)
        h = re.search(r"high-contrast\(([^)]*)\)", body)
        if d:
            r["dark"].add(d.group(1).strip())
        if h:
            r["hc"].add(h.group(1).strip())
    return rec


def pick(s):
    """A token may appear with several values; keep the most frequent-looking one."""
    vals = sorted(s)
    return vals[0] if vals else None


def main():
    rec = harvest()
    out = []
    out.append("/* ==========================================================================")
    out.append("   HMTI Polinema — app tokens")
    out.append("")
    out.append("   GENERATED from the values the Brilliant design (canvas main-2.bl,")
    out.append("   project nimble-guava/hmti-web) actually uses. Do not hand-edit without")
    out.append("   re-running tools/gen-tokens.py, or the file drifts from the canvas.")
    out.append("")
    out.append("   Each line names the design token it came from, so a design change is")
    out.append("   a diff here. Tailwind v4 reads @theme; the [data-theme] blocks below")
    out.append("   override the same variables, which is how the design's dark and")
    out.append("   high-contrast values ship.")
    out.append("")
    out.append("   NOT here: the design's `indigo`/`#7C6BF0` dashed outlines and the")
    out.append("   orange `tertiary.mid` on Kit NavIcons. Those are Brilliant's component-")
    out.append("   boundary guides and unset fills, not design content.")
    out.append("")
    out.append("   CONTRAST — the one rule that matters, same shape as the design system's:")
    out.append("     --color-brand #EEC643 as TEXT on a light surface = 1.44:1. Unreadable.")
    out.append("     It is a FILL. Pair it with --color-brand-ink (#0A0A0A) = 12.06:1.")
    out.append("     --color-ink (#011638) is the dark surface; text on it passes AA.")
    out.append("   Verify any new pair before shipping it; do not eyeball.")
    out.append("   ========================================================================== */")
    out.append("")
    out.append('@import "tailwindcss";')
    out.append("")
    out.append("@theme {")
    out.append("  /* --- typography ------------------------------------------------------ */")
    out.append('  --font-sans: "Montserrat", ui-sans-serif, system-ui, -apple-system,')
    out.append('    "Segoe UI", Roboto, sans-serif;')
    out.append('  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;')
    out.append("")
    out.append("  /* The design's type scale overrides Tailwind's: lg/xl/2xl/4xl differ, and")
    out.append("     the design's md (16px) is Tailwind's `base`. */")
    for k, v in FONT_SIZE.items():
        out.append(f"  --text-{k}: {v};")
    out.append("")
    for k, v in LEADING.items():
        out.append(f"  --leading-{k}: {v};")
    out.append("  --tracking-loose: 1.2px;")
    out.append("")
    out.append("  /* --- spacing and radius: NOT overridden -------------------------------")
    out.append("     The design's scales are exactly Tailwind's defaults, so they are used")
    out.append("     through the stock utilities rather than redefined. Redefining them")
    out.append("     under these names breaks Tailwind's own size namespace: a")
    out.append("     `--spacing-2xl` shadows `--container-2xl`, which silently collapses")
    out.append("     `max-w-2xl` to 32px.")
    out.append("")
    out.append("       design $spacing.*   Tailwind utility")
    for k, v in SPACING.items():
        if k == "none":
            continue
        px = v.replace("px", "")
        n = int(px) // 4
        out.append(f"         {k:8} {v:5}       p-{n} / gap-{n} / m-{n}")
    out.append("       + overlap.2xl 32px  → -mt-8 style negative offsets (see 23 · Dasbor PJ)")
    out.append("")
    out.append("       design $radius.*    Tailwind utility")
    for k, v in RADIUS.items():
        out.append(f"         {k:8} {v:8}     rounded-{k}")
    out.append("  */")
    out.append("")
    out.append("  /* --- shadows (design shadow pairs) ------------------------------------ */")
    for k, v in SHADOWS.items():
        out.append(f"  --shadow-{k}: {v};")
    out.append("")
    out.append("  /* --- colour ----------------------------------------------------------- */")
    for ds_name, tw_name in COLOR_MAP.items():
        if tw_name is None or ds_name not in rec:
            continue
        light = pick(rec[ds_name]["light"])
        if not light:
            continue
        out.append(f"  --color-{tw_name}: {light}; /* {ds_name} */")
    out.append("}")
    out.append("")

    def mode_block(selector, key, label):
        rows = []
        for ds_name, tw_name in COLOR_MAP.items():
            if tw_name is None or ds_name not in rec:
                continue
            v = pick(rec[ds_name][key])
            if not v:
                continue
            rows.append(f"  --color-{tw_name}: {v};")
        if not rows:
            return []
        block = [f"/* {label} — values from the design's {label.lower()} mode. */",
                 f'{selector} {{']
        block += rows
        block += ["}", ""]
        return block

    out += mode_block('[data-theme="dark"]', "dark", "Dark")
    out += mode_block('[data-contrast="high"]', "hc", "High contrast")
    out.append("/* The design defines no dark value for primary.mid, secondary.mid,")
    out.append("   tertiary.mid, neutral.mid or color.shadow: those stay fixed in dark mode. */")
    out.append("")
    out.append("@layer base {")
    out.append("  html {")
    out.append("    color-scheme: light;")
    out.append("  }")
    out.append("  html[data-theme='dark'] {")
    out.append("    color-scheme: dark;")
    out.append("  }")
    out.append("  body {")
    out.append("    /* The page is `surface.container`; cards are `surface` on top of it. */")
    out.append("    background-color: var(--color-surface-container);")
    out.append("    color: var(--color-text);")
    out.append("    font-family: var(--font-sans);")
    out.append("    -webkit-font-smoothing: antialiased;")
    out.append("  }")
    out.append("}")
    out.append("")

    dest = pathlib.Path("/home/user/workspace/repo/src/styles/tokens.css")
    dest.write_text("\n".join(out))
    colors = sum(1 for k, v in COLOR_MAP.items() if v and k in rec)
    print(f"wrote {dest} ({len(out)} lines)")
    print(f"  {colors} colour tokens, {len(FONT_SIZE)} sizes, {len(SPACING)} spacing, {len(RADIUS)} radius")
    dark = sum(1 for k in rec if rec[k]['dark'] and k in COLOR_MAP and COLOR_MAP[k])
    hc = sum(1 for k in rec if rec[k]['hc'] and k in COLOR_MAP and COLOR_MAP[k])
    print(f"  dark overrides: {dark}   high-contrast overrides: {hc}")


if __name__ == "__main__":
    main()
