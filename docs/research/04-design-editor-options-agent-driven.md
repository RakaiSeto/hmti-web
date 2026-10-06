# 04 — Design editors an agent can drive (Figma alternatives for bb on Fedora)

**Status:** research note, 2026-09-27. **Question:** which design editor lets an agent
running in **bb** on this machine (Nobara 44 / Fedora family, KDE) read a design,
edit it, and emit code — so the design can be *coded from bb* rather than drawn by hand.

Scope note: star counts and release data captured 2026-09-27. "Linux" means Fedora/Nobara
specifically, not "runs in a VM somewhere".

---

## 1. The one distinction that matters

Every candidate falls into one of two families. The family matters more than the feature list.

| Family | How the agent works | Consequence |
| --- | --- | --- |
| **Design-as-text** | The design is a file on disk (JSON / custom text DSL) that the agent reads and writes like code | Works with *any* bb provider, including one with no MCP support; diffable in git; no running app needed for read |
| **Design-in-a-service** | The design lives in an app or database; the agent goes through **MCP** or a plugin API | Needs an MCP-capable provider (Codex / Claude Code / OpenCode), and the app must be running |

Two corollaries that reframe the whole search:

1. **If the agent drives the tool over MCP, the tool's built-in AI is irrelevant.** The model
   doing the work is bb's provider model (local or cloud). "Does the app support Ollama?" only
   matters if you want to use the app's *own* chat, not for a bb workflow.
2. **"Design → code" is a spectrum.** OpenPencil and Brilliant export code from a design file;
   Onlook never separates the two — it edits your React source directly, so the code *is* the
   design. The second option is less glamorous but has zero translation loss.

---

## 2. Comparison

| | **OpenPencil** | **Brilliant** | **Penpot** | **Onlook** | Graphite | Lunacy |
| --- | --- | --- | --- | --- | --- | --- |
| What it is | AI-native vector design tool (Figma-like) | AI-native vector design tool (Figma-like) | Open-source design platform | Visual editor for React code | 2D art / procedural graphics | Figma-like offline editor |
| License | **MIT** | Proprietary | **MPL-2.0** | **Apache-2.0** | Apache-2.0 | Free, closed |
| Traction (2026-09-27) | 6.0k ★, v0.8.4 | docs repo 19 ★; product beta | 60.4k ★ | 26.8k ★, v0.2.32 | 27.4k ★ | — |
| Runs on Fedora | **Native** `.deb` + `.AppImage` (x64/arm64), single Rust binary | **Browser only** (Chrome/Edge/Firefox; Safari unsupported). Desktop app is macOS/Windows | Self-host via Docker/Podman; browser UI | `.deb` + `.AppImage` (Electron) | Browser (WASM) | Native Linux app |
| Agent surface | **MCP** (stdio `--mcp` + HTTP `127.0.0.1:<port>/mcp`) **and `op` CLI** (headless mode) | **MCP** (`127.0.0.1:3333/mcp` desktop, or `@brilliant-hq/mcp` bridge for the web tab) | **Official MCP** (server ↔ WebSocket ↔ plugin in the browser tab) | None needed — it edits the repo's code | None | None |
| Design file | `.op` = JSON, git-friendly | `.bl` = Blueprint text, git-friendly, "one element per line" | Penpot storage/DB; `.penpot` export | Your Next.js source | `.graphite` | `.sketch`-ish native |
| Code export | React+Tailwind, HTML+CSS, Vue, Svelte, Flutter, SwiftUI, Jetpack Compose, React Native | React, HTML (page/document/flex), SVG, PDF, PNG/JPEG/WebP, MP4/MOV | Via plugins/MCP | The code itself | none (art) | none for agents |
| Built-in chat + local models | 9+ provider presets; **local Ollama/vLLM base URL supported**; model-capability tiers tune prompts for small models | BYO key (Anthropic/OpenAI/Google/OpenRouter), Claude Code/Codex CLI, **custom OpenAI-compatible endpoints with LM Studio/Ollama/vLLM presets** | — | OpenRouter etc. | — | — |
| Best for | Coding designs from bb with zero licensing friction | Polished canvas + Figma import, keep designs as text files | Self-hosting, staying fully open source | Design tweaks on an existing React app | Illustration/art, not UI | Offline sketching |

---

## 3. Tool notes

### OpenPencil — lowest friction for this setup

- MIT, Rust, created 2026-02, active (last push 2026-09-27). Releases ship
  `OpenPencil-x64-linux.AppImage`, `x64-linux.deb`, plus a standalone `op-cli-linux-x86_64.tar.gz`.
- **Two agent doors, both local:**
  - `op` CLI: `op design @file.txt`, `op insert '<json>'`, `op export`, and a codegen pipeline
    (`op codegen:plan` → `codegen:submit` → `codegen:assemble --framework react` → `codegen:clean`).
  - MCP server (`op-mcp` crate): stdio via the binary (`--mcp <path>`), or a live HTTP endpoint
    `127.0.0.1:<port>/mcp` while the app runs. One-click install into Claude Code / Codex /
    OpenCode / Kiro / Copilot.
- **Headless mode** is the killer feature for bb: `op start --headless --file design.op` runs a
  windowless, file-backed MCP server — an agent can design and export in a bb worktree with no GUI.
- `op install --target codex` installs the [OpenPencil skill](https://github.com/ZSeven-W/openpencil-skill)
  (an LLM skill for the CLI + MCP tools).
- Local models are a first-class case: the README documents model-capability profiles
  ("basic-tier" models — MiniMax, Qwen, Llama, Mistral — get simplified nested-JSON prompts),
  and source comments confirm local Ollama/vLLM base URLs are supported.
- Caveats: young project (first release 2026), one primary author, UI is a Rust/GPU app
  (no Electron), Chinese-ecosystem integrations (sponsors, Anthropic-format passthrough for
  Kimi/GLM/DouBao) — none of which blocks the CLI/MCP path.

#### Figma round-trip is one-way

`op import:figma design.fig` reads a Figma file into `.op` (layout, fills, strokes, effects,
text, images and vectors preserved), but OpenPencil has **no `.fig` writer**. Figma's own
importers accept `.sketch`, `.fig`, `.jam`, `.deck`, `.buzz`, `.site`, `.make`, PNG/JPG and
`.pptx` — not `.op`. Routes back into Figma:

| Route | Survives | Lost |
| --- | --- | --- |
| **SVG export** — desktop app export dialog only; the CLI/MCP export formats are `png`, `jpeg`, `webp`, `pdf` — → paste/drag into a Figma file | vectors, fills, strokes, text, groups | auto-layout, components/variants, variables/tokens, constraints. Figma's own docs call SVG the lossless cross-tool format. |
| **HTML+CSS export** → `html.to.design` Figma plugin | screens rebuilt as frames, auto-layout heuristics | exactness; it is a third-party plugin |
| PNG / JPEG / WebP / PDF | pixels | all structure — review only |
| `op export-deck --format pptx` → Figma file browser | slide content | anything outside the deck boards |

A true round trip would need a small Figma plugin that reads `.op` (documented JSON) through
the Plugin API; none exists today. Brilliant has the same shape (imports *from* Figma,
exports React/HTML/SVG/PDF) and Penpot imports SVG, not `.fig` — so "design in an open tool,
finish in Figma" always means a lossy SVG/code hand-off, not a file interchange.

### Brilliant — best canvas, Linux only through the browser

- Product is proprietary; the *docs* are on GitHub (`brilliant-hq/brilliant`, no license file).
  Files are `.bl` "Blueprint" text; a workspace is just a folder — "your canvases are files
  inside it … no hidden project database". Git branch/PR/`git blame` workflows are the intended
  history mechanism.
- **Linux path:** brilliant.design in Chrome/Edge/Firefox (Safari unsupported), plus a one-time
  local bridge: `claude mcp add brilliant -- npx -y @brilliant-hq/mcp`. That package is a
  "dumb stdio↔loopback router" — MCP and design data never leave the machine.
  Desktop app (with `http://127.0.0.1:3333/mcp`, no auth) is macOS/Windows only.
- **MCP-driven agent use is unlimited on every plan, Free included**; only the built-in chat is
  capped (10 messages/day with your own AI on Free). That makes it a legitimate free design
  surface for bb.
- Import from Figma, export to React/HTML/SVG/PDF/video; built-in design-system files
  (`Styles/default.ds`) that generate resolved tokens for external tools.
- Caveats: closed source, no self-host, account required, browser "local network" permission
  prompts (Chromium 147+) and the plugin/bridge must be running for MCP.

### Penpot — the fully open, self-hosted route

- MPL-2.0, 60.4k ★, the most mature open-source Figma alternative. Runs as a web app; self-host
  via Docker/Podman compose. Community Electron wrappers exist (e.g. `author-more/penpot-desktop`)
  but the browser UI is the supported path.
- **Official MCP server**, now in the main repo (`penpot/penpot/tree/develop/mcp`; the standalone
  `penpot/penpot-mcp` repo was archived 2026-02-03 when it was integrated). Architecture:
  MCP server ↔ WebSocket ↔ a **Penpot plugin running in your browser tab**, which executes
  Plugin-API code. Requires Node ≥22, `npm run bootstrap`; plugin server on `:4400`, MCP on
  `:4401` (`/mcp` streamable HTTP, `/sse` legacy).
- Works with self-hosted Penpot, which is the point: no cloud dependency, no proprietary bits.
- Caveats: heaviest setup of the four (self-host + two local servers + a plugin tab that must
  stay open); no plain-text design file, so an agent without MCP can't read the design at all;
  browser PNA restrictions can require granting local-network access (or using Firefox).

### Onlook — different category: code-as-design

- Apache-2.0, 26.8k ★, `.deb`/`.AppImage` for Linux. "The Cursor for designers": a visual
  editor that operates **on a real Next.js + Tailwind codebase**, not on a design file.
- The agent surface is the repository itself — bb's agent edits the same code, and Onlook is
  the human GUI on top. No MCP, no export step, no translation loss.
- Caveats: Next.js/Tailwind-only by design; the open-source repo is the original product and the
  team's newer hosted product is a separate early-access thing; LLM features lean on OpenRouter.

### Also considered (short)

| Tool | Why it's not the answer here |
| --- | --- |
| **Graphite** (Apache-2.0, 27.4k ★) | Excellent Rust 2D/vector + node-based procedural tool, browser editor — but it's a graphic-design/art tool, not UI/design-system work, and has no agent surface or code export. |
| **Lunacy** (Icons8) | Free, native Windows/macOS/Linux, Figma import, self-deployable "Lunacy Cloud" — but closed source, no MCP/CLI agent surface. Good offline sketch tool, dead end for bb. |
| **Pencil Project** (GPL-2.0, 9.9k ★) | The old diagramming/prototyping tool OpenPencil positions itself against. Cross-platform, but no AI/MCP and no modern component model. |
| **Quant-UX** (GPL-3.0, 2.7k ★) | Self-hostable prototyping + user testing with Vue code export (`vue-low-code`). Interesting, but a research/prototyping tool, not an agent-driven design surface. |
| **Akira** (GPL-3.0, 5.3k ★) | The historic "Figma for Linux" (Vala/GTK). Effectively stalled (last push 2025-12), no agent surface. |
| **Plasmic** (MIT, 7.0k ★) | Visual React builder with codegen and self-host — closer to "low-code builder" than "design tool". Worth a look if the goal shifts from *designing* to *assembling* UI. |
| **Figma itself** | Not dead on Linux: Figma now recommends its **remote MCP server** (hosted, no desktop app), and `GLips/Figma-Context-MCP` (MIT, 15.9k ★) uses the REST API + a token from any OS. If the existing Figma library is the asset, this is the cheapest path — but you stay on a proprietary, cloud-bound canvas. |

---

## 4. Wiring a design tool into bb

### bb facts that constrain the recipes

- Available providers on this machine: `codex`, `claude-code`, `pi`, `acp-opencode`,
  `acp-cursor`, `acp-omp` (`bb provider list`).
- **MCP lives in the provider CLI, not in bb core.** Codex (config.toml `mcp_servers`),
  Claude Code (`claude mcp add`) and OpenCode (`opencode.json` `mcp`) all support stdio and
  streamable-HTTP MCP servers. **Pi has no MCP client** — a pi thread reaches a design tool
  through the shell (`op` CLI, `curl` against an MCP HTTP endpoint) or through the design file.
- **Local models:** pi connects to Ollama / LM Studio / vLLM / SGLang via
  `~/.pi/agent/models.json` (`"baseUrl": "http://localhost:11434/v1", "api": "openai-completions"`),
  or to GGUF models through its llama.cpp router (`/llama`). OpenCode has its own provider
  config. bb itself has no "local" provider id — the local model is configured inside the
  provider CLI you pick for the thread.

### Recipe A — OpenPencil (recommended first try)

```bash
# 1. CLI only (no GUI needed) — also usable from a bb worktree
curl -fsSL https://raw.githubusercontent.com/ZSeven-W/openpencil/main/scripts/install-op.sh | bash
# or grab OpenPencil-*-x64-linux.AppImage / .deb from GitHub Releases

# 2. design headlessly, file-backed
op start --headless --file design.op        # windowless MCP server on a file
op design @landing.txt                      # batch design from a DSL file
op export --output hero.png --format png

# 3. code out
op codegen:plan <plan.json> ; op codegen:assemble <planId> --framework react
op install --target codex                   # install the OpenPencil agent skill
```

Then either let the bb agent call `op` directly (works on every provider, including pi), or
register the MCP server with a Codex/OpenCode/Claude Code thread
(stdio: the desktop binary with `--mcp design.op`; HTTP: `http://127.0.0.1:<port>/mcp`).

### Recipe B — Brilliant

1. Open <https://brilliant.design> in Firefox or Chromium on Fedora, sign in.
2. `npx -y @brilliant-hq/mcp` as the MCP server (or the app's `http://127.0.0.1:3333/mcp` on
   macOS/Windows) — register it in the Codex/OpenCode/Claude Code config of a bb thread.
3. Keep the workspace folder inside the repo so `.bl` files land in git; a pi thread can then
   read and patch them as text without MCP at all.

### Recipe C — Penpot self-hosted

1. Self-host Penpot (Docker/Podman compose) and open the UI in a browser.
2. From `penpot/penpot/mcp`: `npm install && npm run bootstrap` → plugin server `:4400`,
   MCP server `:4401`.
3. Load `http://localhost:4400/manifest.json` as a plugin in the Penpot tab and click
   "Connect to MCP server"; keep the plugin UI open.
4. Point the bb provider at `http://localhost:4401/mcp` (stdio-only clients:
   `npx -y mcp-remote http://localhost:4401/sse --allow-http`).

### Recipe D — Onlook (if the project is already React/Next.js)

Point Onlook at the project directory; humans tweak visually, bb agents edit the same files.
No bridge, no export — and no design artifact to keep in sync.

### Keeping this repo's tokens authoritative

This repo already ships `design-system/tokens.json` + `tokens.css`. Both leading candidates can
carry that system rather than invent a new one:

- **OpenPencil**: design variables (color/number/string, multi-theme) generate CSS custom
  properties (`var(--name)`) in code output.
- **Brilliant**: `Styles/default.ds` emits a resolved `.gen.yaml` that Style Dictionary and
  build scripts can read.

Either way, treat this repo as the token source of truth and the design tool as a consumer.

---

## 5. Recommendation

1. **Try OpenPencil first.** MIT, native Linux binary, `op` CLI + headless MCP, JSON design files
   in git, multi-framework code export, and explicit support for small/local models. It is the
   only candidate where bb can design and export with no GUI, no account, and no cloud.
2. **Keep Brilliant as the "pretty canvas" option.** Best-in-class agent-native editing, free
   for MCP-driven agents, `.bl` text files in git — but browser-only on Fedora and proprietary.
3. **Choose Penpot if self-hosting/MPL matters more than convenience** — expect the most setup,
   and remember an agent can't read the design without MCP.
4. **Skip the rest** unless the goal changes (Onlook if it becomes a React project; Figma remote
   MCP if the existing Figma library is worth keeping).

Decision checklist before committing: (a) does the agent need to *write* designs or only read
them? (b) must the design file be diffable in PRs? (c) does the thread run a provider with MCP,
or pi? (d) is a running GUI acceptable in the loop, or must it be headless?

---

## 6. Source index

| # | URL | Used for |
| --- | --- | --- |
| 1 | <https://github.com/ZSeven-W/openpencil> (README, `crates/op-cli/src/usage.txt`, `crates/op-ai/src/chat_provider.rs`, `crates/op-chat-agent/src/provider_dial.rs`) | license, Linux releases, `.op` format, MCP stdio/HTTP, `op` CLI + headless mode, codegen targets, local Ollama/vLLM support |
| 2 | <https://github.com/ZSeven-W/openpencil/releases> (v0.8.4 assets) | `.AppImage`/`.deb`/`op-cli-linux-*` artifacts |
| 3 | <https://op.zseven.tech/llms.txt> | product summary, file format, MIT license |
| 4 | <https://github.com/ZSeven-W/openpencil-skill> | agent skill for `op`/MCP |
| 5 | <https://brilliant.design/docs/getting-started/installation.mdx> | macOS/Windows installers, sign-in |
| 6 | <https://brilliant.design/docs/agents/overview.mdx> | MCP endpoint `127.0.0.1:3333/mcp`, web bridge, browser support, export formats, unlimited MCP on Free |
| 7 | <https://brilliant.design/docs/ai/providers-and-models.mdx> | BYO keys, Claude Code/Codex CLI, custom OpenAI-compatible endpoints (LM Studio/Ollama/vLLM) |
| 8 | <https://brilliant.design/docs/workspace/canvases-and-files.mdx> | workspace-as-folder, `.bl` Blueprint text, git workflows |
| 9 | <https://www.npmjs.com/package/@brilliant-hq/mcp> | local stdio↔loopback bridge, UNLICENSED, v0.1.8 (2026-09-25) |
| 10 | <https://github.com/brilliant-hq/brilliant> (`agent.md`, README) | MCP tool surface, Blueprint objects, repo license status |
| 11 | <https://github.com/penpot/penpot/tree/develop/mcp> + archived <https://github.com/penpot/penpot-mcp> | official MCP architecture (plugin + WebSocket), ports 4400/4401, Node ≥22, self-host compatibility |
| 12 | <https://github.com/onlook-dev/onlook> (+ v0.2.32 release assets) | code-native model, `.deb`/`.AppImage`, Next.js/Tailwind scope |
| 13 | <https://github.com/GraphiteEditor/Graphite> | license, scope (2D art/procedural), no UI-code export |
| 14 | <https://icons8.com/lunacy> | free editor, native Windows/macOS/Linux, Lunacy Cloud self-deploy, no agent surface |
| 15 | <https://github.com/evolus/pencil>, <https://github.com/KlausSchaefers/quant-ux>, <https://github.com/akiraux/Akira>, <https://github.com/plasmicapp/plasmic> | legacy/adjacent tools compared |
| 16 | <https://developers.figma.com/docs/figma-mcp-server/> and <https://github.com/GLips/Figma-Context-MCP> | Figma baseline: remote MCP (no desktop app) and REST-based community MCP |
| 17 | `bb provider list`, `bb guide providers`; pi docs `docs/models.md` | provider/MCP/local-model constraints inside bb |
| 18 | <https://help.figma.com/hc/en-us/articles/360041003114-Import-files-to-the-file-browser> | Figma's accepted import file types (`.sketch`, `.fig`, `.jam`, `.deck`, `.buzz`, `.site`, `.make`, PNG/JPG, `.pptx`) |
| 19 | <https://help.figma.com/hc/en-us/articles/360040030374-Copy-assets-between-design-tools> | "Because SVG is a lossless format, we recommend importing and exporting assets as SVGs when moving content between design tools" |
| 20 | <https://www.figma.com/community/plugin/1159123024924461424> (html.to.design) | HTML → editable Figma layers, the code-export route back into Figma |
| 21 | OpenPencil `crates/op-cli/src/usage.txt`, `crates/op-render-export/src/editor.rs`, `crates/op-editor-core/src/export_dialog_state.rs` | export formats (PNG/JPEG/WEBP/SVG/PDF + pptx/html/pdf decks), `op import:figma` is import-only |
