# Context

The words this project uses about itself. If a term here means something
specific, it means that everywhere: in code, in commits, and in review.

## The product

**Tool** — one capability, such as `json`, `qrcode` or `base-converter`. A tool
has an id, which is also its route segment and its CLI subcommand, and exactly
one implementation of its logic.

**Core** — `packages/tols/src/core/`. The single implementation of every tool's
logic. Zero runtime dependencies, browser-safe, no Node-only APIs. Both
surfaces import it; every web tool does.

**Surface** — a way of reaching a tool. There are two: the **web surface**
(`apps/web`) and the **CLI surface** (`packages/tols/bin`). Neither owns tool
logic. Both are arrangement over the core.

**Adapter** — the layer that makes the core usable from one surface.
`packages/tols/src/tools/` wraps the core in argument parsing;
`apps/web/src/lib/tools/` wraps it in a UI.

**Registry** — `apps/web/src/lib/config/registry.js`. The single source of tool
metadata. Every surface of the site derives from it: the homepage grid, the
sidebar, `⌘K` search, page titles, the sitemap.

## The web surface

**Page shell** — the chrome around a page: header, wordmark, breadcrumb,
sidebar, `⌘K` trigger, theme toggle. Two of these currently exist, one for the
tool pages and one for the homepage, which is a known duplication rather than a
design.

**Workbench** — the two-pane arrangement a text-in, text-out tool uses.

**Pane** — one region of a workbench, labelled `stdin` or `stdout` and carrying
a byte count.

**Command strip** — the exact runnable `tols` command derived live from the
tool's current state when the current web action has a CLI equivalent. A
surface-specific action omits the strip instead of advertising an approximation.

**Action rail** — the row of controls beneath the panes: mode segments,
example, clear, paste, copy, share.

**Fact strip** — a row of derived readouts, such as entropy, byte delta or
match count, that a tool shows instead of or beside a `stdout` pane.

**Token** — a CSS custom property in `apps/web/src/app.css`.

**Chrome** — every visual decision that is not a tool's own content: spacing,
borders, type scale, colour, elevation, motion.

## Two kinds of test

The distinction matters because the two have different rules when an interface
changes.

**Guard test** — exists to stop a shared primitive being hand-written again.
It reads source files rather than rendering them, and fails with a list of
offending filenames. When a primitive's interface changes deliberately, its
guard moves with it.

**Behaviour test** — checks what a tool produces: formatted output, encoded
bytes, a hash digest. A change to presentation is never a reason to change one.

## Surface cardinality

The web surface and the CLI are intentionally not one-to-one, because the web
exposes JWT encode and decode as separate pages. The web therefore has one more
surface entry than the CLI. Each number is correct in its own surface, so the
project does not publish one product-wide tool count.
