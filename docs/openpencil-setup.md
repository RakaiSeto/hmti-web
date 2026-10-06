# OpenPencil setup (this machine)

OpenPencil is the design tool chosen for agent-driven design work on this repo — the agent
designs in `.op` files and exports code. Decision record and comparison with the alternatives:
[`research/04-design-editor-options-agent-driven.md`](research/04-design-editor-options-agent-driven.md).

Installed 2026-09-27 on Nobara 44 (Fedora family, x86_64).

## What is installed where

| Piece | Path | Notes |
| --- | --- | --- |
| `op` CLI (v0.8.4) | `~/.local/bin/op` | Thin client; drives the editor/MCP server over HTTP |
| Desktop + headless server | `~/.local/opt/openpencil/openpencil-desktop` | 119 MB native Rust binary; also symlinked into `~/.local/bin` so `op` finds it |
| App menu entry | `~/.local/share/applications/openpencil.desktop` | Launch "OpenPencil" from the KDE menu |
| Agent skill | `~/.agents/skills/openpencil-design/SKILL.md` | PenNode schema + DSL + workflow for Pi/bb agents |
| Skill (other agents) | `~/.config/opencode/…`, `~/.codex/openpencil-skill/…`, `~/.cursor/plugins/…`, `~/.claude/plugins/cache/…` | Installed by `op install` |

Releases are all marked **pre-release** on GitHub, so `install-op.sh` needs `OP_PRERELEASE=1`;
`/releases/latest` returns 404. Downloads were verified against the release `SHA256SUMS.txt`.

## Daily use

```bash
# GUI editor (design by hand)
openpencil-desktop                       # or: KDE menu → OpenPencil

# Headless server for agents (no display needed)
op start --headless --file design.op     # prints port + mcpUrl, then detaches
op status                                # {"running":true,"port":3100,...}
op stop
```

Any command works against either target — the GUI app or a headless server.

```bash
op tools                                 # 166 MCP tools + input schemas
op design @hero.dsl                      # batch design DSL (I/U/C/M/D/R/G ops)
op insert --parent n1 '{"type":"text","content":"Hello"}'
op design:refine --root-id n1            # resolve icons, validate layout
op export --item n1 --output hero.png --format png     # png | jpeg | webp | pdf
op codegen:plan '<plan.json>'            # → planId
op codegen:submit <planId> '<chunk.json>'
op codegen:assemble <planId> --framework react
op codegen:clean <planId>
```

**Export formats through the CLI/MCP are `png`, `jpeg`, `webp`, `pdf`** — SVG export exists
only in the desktop app's export dialog. When a call targets a document with no Live Canvas
selection, pass `--item <nodeId>` explicitly or you get "no node is selected".

## How this connects to bb

1. **Design files are text.** `.op` is JSON — commit it, diff it, let any bb provider read it.
2. **Agents drive it through the skill.** `~/.agents/skills/openpencil-design/` teaches the
   PenNode schema and the `op` workflow; Pi/bb threads load it automatically when a task is
   about designing.
3. **Two doors, same tools.** Either the agent shells out to `op`, or an MCP-capable provider
   (Codex / Claude Code / OpenCode) registers the server:
   - stdio: `openpencil-desktop --mcp design.op`
   - HTTP: `http://127.0.0.1:<port>/mcp` (see `op status`)
4. **Codegen is agent-written, server-assembled.** `codegen:plan` declares chunks per node,
   the agent writes each chunk, `codegen:assemble` validates contracts and combines them
   (react, html, vue, svelte, flutter, swiftui, compose, react-native).

## Per-provider setup in bb

Both providers discover skills from their own roots, so the `op install` output (plus the Pi copy
in `~/.agents/skills/`) is already the whole setup for skill-based use. Only OpenCode can also
take OpenPencil as a native MCP server.

### Pi — `bb thread spawn --provider pi`

- Skill: `~/.agents/skills/openpencil-design/SKILL.md`, read at session start. Threads created
after the install have it; an already-running session needs a new thread.
- Pi has **no MCP client**, so the agent drives the design with the `op` CLI over bash:
  ```bash
  op start --headless --file design.op      # or the GUI; both serve MCP on 127.0.0.1
  op design @screen.dsl
  op codegen:assemble <planId> --framework react
  ```
- Nothing else to configure — no port, no JSON, no env var.

### OpenCode — `bb thread spawn --provider acp-opencode`

- Skill: `~/.config/opencode/skills/openpencil-skill/` (symlink installed by `op install`).
- Optional native tools via an MCP entry. Prefer **project scope** (`opencode.json` in the repo
root) over the global `~/.config/opencode/opencode.jsonc` — the global file already carries a
`brilliant` entry, and the document path here is project-specific.

  Remote — needs the GUI or a headless server running; pin the port so the URL never drifts:
  ```json
  {
    "$schema": "https://opencode.ai/config.json",
    "mcp": {
      "openpencil": { "type": "remote", "url": "http://127.0.0.1:3100/mcp", "enabled": true }
    }
  }
  ```
  ```bash
  op start --headless --file design.op --port 3100
  ```

  Local stdio — self-contained (no running server), pinned to one document that must already exist:
  ```json
  {
    "mcp": {
      "openpencil": {
        "type": "local",
        "command": ["openpencil-desktop", "--mcp", "/abs/path/design.op"],
        "enabled": true
      }
    }
  }
  ```
- Verify with `opencode mcp list` (shows each server and its status).
- MCP caveat, from OpenPencil's own skill: the standalone MCP server registers no hooks, so
  `path` icons never resolve there — use `icon_font` nodes in MCP contexts.

### Context cost

OpenPencil exposes **166 MCP tools**. The skill + CLI path keeps that out of the context window;
MCP loads all of it. For long agent sessions, the CLI path is the cheaper default, with MCP as an
opt-in per project.

## First design

`~/openpencil-test/` holds a working example built during setup: `hero.dsl` (a landing page
using this repo's brand tokens — `#FFE600`, `#041587`, `#0A0A0A`, Montserrat) plus the
exported `hero.png` / `hero.pdf` and `demo.op`.
