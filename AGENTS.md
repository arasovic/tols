# tols — Development Guide

Instructions for AI coding assistants and developers working on the tols
monorepo. [CONTRIBUTING.md](CONTRIBUTING.md) covers setup and how to add a tool.
[CONTEXT.md](CONTEXT.md) defines the terms used here.

## Development Environment

```bash
npm install    # workspace root — installs both packages
npm run dev    # site on localhost
```

Node `^22.22.2 || ^24.15.0 || >=26` — jsdom 30 sets that floor, and CI runs 24.
`node_modules/tols-cli` is a workspace symlink to
`packages/tols`, so editing the core reaches the web build immediately — no
publish, no reinstall.

## Project Structure

```
tols/
├── packages/tols/            # CLI + shared core, published to npm as tols-cli
│   ├── bin/tols.js           # entry point
│   ├── src/cli.js            # argv parsing, dispatch
│   ├── src/registry.js       # CLI tool registry — NOT the web one
│   ├── src/io.js             # stdin/@file reading
│   ├── src/output.js         # --json and plain output shaping
│   ├── src/core/*.js         # 29 modules. THE logic. Zero-dep, browser-safe.
│   ├── src/tools/*.js        # CLI adapters — flags, actions, arg parsing
│   └── test/                 # 63 files, 529 tests
└── apps/web/                 # SvelteKit site, static build, GitHub Pages
    ├── src/app.css           # 130 CSS custom properties (tokens)
    ├── src/routes/(app)/[tool]/     # ONE route for all 30 tools + page shell
    ├── src/routes/+page.svelte      # homepage — sits OUTSIDE the (app) shell
    ├── src/lib/config/registry.js   # single source of web tool metadata
    ├── src/lib/config/seo.js        # per-tool <head> metadata, keyed by id
    ├── src/lib/cli/          # builds the command strip's `tols` command
    ├── src/lib/ui/           # shared primitives — ToolShell, Workbench, Panel…
    ├── src/lib/tools/        # one Svelte component per tool
    ├── src/lib/components/   # Sidebar, SearchOverlay, ToolCard…
    ├── tests/                # 70 files, 1186 tests + 7 skipped
    └── tests-built/          # guards that read build/ — `npm run test:built`
```

**Two files are called `registry.js`.** `packages/tols/src/registry.js` registers
CLI tools; `apps/web/src/lib/config/registry.js` holds web tool metadata. Name
the path, not the file.

## Dependency Chain

```
packages/tols/src/core/*.js      (no deps at all — zero-dependency, browser-safe)
        ↑                                    ↑
packages/tols/src/tools/*.js       apps/web/src/lib/tools/*.svelte
   (CLI adapters)                     (UI adapters)
```

Nothing flows the other way. The core never imports from a surface.

## Commands

- **Both suites:** `npm test`
- **The built-output guards:** `npm run build && npm run test:built`. They are
  deliberately outside `npm test` so the normal suite never needs a build, and
  they fail rather than skip when `build/` is missing.
- **One workspace:** `npm test -w apps/web` or `npm test -w packages/tols`
- **One test file** (from the workspace directory):
  `node ../../node_modules/vitest/dist/cli.js --run tests/canonical.test.js`
- **Type check:** `npm run check` — must be 0 errors before committing
- **Build:** `npm run build` — static output into `apps/web/build/`
- Baseline as of 2026-08-08, after the route collapse (`a1e7f41`): web 1186
  passed / 7 skipped, CLI 529 passed, `check` 0 errors with 3 warnings — the
  line-clamp one in `ToolCard.svelte` plus two `a11y_consider_explicit_label`
  in `LoremTool.svelte` that svelte-check 4 newly surfaces on pre-existing
  code. Record your own baseline before changing anything; if it differs, say
  so before you start.
- **Never create tags.** `git tag vX.Y.Z && git push origin vX.Y.Z` publishes to
  npm through GitHub Actions OIDC. Do not bump the version in
  `packages/tols/package.json` either.
- **Never edit `.github/workflows/`** unless the task says so. Nothing warns you
  a workflow is broken until a release fails.

## Code Quality

- **A tool's logic has exactly one implementation, in the core.** If
  `packages/tols/src/core/` does it, the web imports it. Never reimplement.
  Deliberate divergence is allowed but must be stated in the change.
- **The core must run in a browser.** No `Buffer`, no `node:*` in
  `packages/tols/src/core/`. Use `btoa`/`atob` and `TextEncoder`/`TextDecoder`.
  Node-specific work belongs in the CLI adapter.
- **`packages/tols` gains no runtime dependency, ever.** Zero-dep is the
  product's whole claim. Data files are fine; packages are not.
- **Every web surface derives from `registry.js`.** Never hardcode a tool list,
  a title, or a count — the homepage grid, sidebar, `⌘K` search, page titles and
  the sitemap all read from it.
- **Use the primitives in `src/lib/ui/`.** Do not hand-roll chrome. The guard
  tests read source files and will fail with your filename in the list; the fix
  is to use the primitive, not to work around the pattern it looks for.
- Read files in full before wide-ranging changes. Search snippets are not enough
  to justify a broad edit.
- Always ask before removing functionality that appears intentional.

## Git

Multiple sessions and worktrees may be running against this repository at the
same time, each changing different files. Git operations that touch staged,
unstaged or untracked files outside your own changes destroy other sessions'
work.

- Only commit files YOU changed in THIS session.
- Stage explicit paths (`git add <path> <path>`). Never `git add -A` or
  `git add .`.
- Run `git status` before committing and verify you are staging only your files.
- **Never run:** `git reset --hard`, `git checkout .`, `git clean -fd`,
  `git stash`, `git commit --no-verify`, or any force push.
- If a rebase conflict lands in a file you did not modify, abort and ask.
- Never commit unless the user asks.

Commit format is conventional commits with a scope where one fits
(`fix(qrcode):`, `refactor(web):`, `docs:`). Subject under 72 characters; the
body is the right place for *why*. Never add `Co-Authored-By`.

## Testing

- **A green suite is not evidence.** Check why it is green.
- **Where a tool has a real output format** — a QR matrix, barcode bars, gzip
  bytes — decode what you produced. A passing unit test is weaker evidence. The
  CLI suite already decodes QR codes with `jsqr`; reuse the idea.
- **jsdom computes no layout.** `getBoundingClientRect` returns zeros, so no
  test here can see a spacing, overflow or alignment defect. If you changed
  spacing, grids or responsive behaviour, open the page in a browser at a wide
  and a narrow width, and say that you did.
- **Guard tests** (`layout`, `brand`, `fonts`, `design-tokens`, `canonical`, the
  `*-chrome` tests) read source and assert an offender list is empty. When a
  primitive's interface changes deliberately, the guard moves with it.
- **Behaviour tests** check what a tool produces. A presentation change is never
  a reason to edit one.
- If you must change a test, name the reason and record the old and new
  expectation. A test failing for any other reason is a regression to diagnose.
  Test counts must not drop — fixing a bug usually changes an assertion rather
  than removing it.
- If you create or modify a test file, run it and iterate until it passes.

## Known Pitfalls

### DO NOT use an SVG for `og:image`

It was an SVG on all 31 routes and no social platform rendered a preview.
Nothing failed and no test caught it; it was invisible until someone pasted a
link. Use a raster PNG.

### DO NOT let a second canonical be emitted

`<svelte:head>` does not deduplicate. `app.html` was stamping a canonical on
every page while all 31 routes declared their own.
`apps/web/tests/canonical.test.js` locks this.

### DO NOT gate a guard on a condition CI never meets

`canonical.test.js` was moved onto the built pages and wrapped in
`describe.skipIf(!existsSync(build))` so `npm test` would stay green without a
build. Locally, with a stale `build/` lying around, it showed five passing
tests. In CI it never ran once: `deploy.yml` runs `npm test` before
`npm run build`, and `build/` is gitignored. The guard covering this repo's two
most expensive shipped bugs was dead on the only machine whose verdict ships,
and the suite reported green.

A guard that needs a build belongs in `tests-built/`, must **fail** when the
build is missing, and needs its own CI step after the build. A skipping guard
is worse than no guard, because it still reports success.

### DO NOT trust a green suite on an encoder change

A change reported as annotation-only silently rewrote the QR mask-penalty scan
so it read rows twice and never looked at a column. All 528 CLI tests stayed
green, because a QR code still decodes under any mask. It was caught by reading
the diffstat, not the report. The guard that now covers it asserts the penalty
score is unchanged under transposition of the matrix.

### DO NOT use `\b` with `git grep -E`

`git grep -E` has no word-boundary support. The pattern matches nothing
silently, which once produced a confident and wrong "only four references
exist". Use `grep -rE` or an explicit character class.

### DO NOT publish a tool count anywhere

The site has 30 tools; the CLI has 29, because the web splits `jwt` into a
decoder page and an encoder page. Both numbers are correct in their own context,
and printing either invites "so which one is missing?". A test asserts no digit
appears in the hero headline.

### DO NOT assume the core is the correct side

`html`/`xml` in the core use a hand-written tag scanner where a `>` inside
quotes ends a tag. The web had the same limitation, so consolidating changed
nothing — but neither implementation is right. Comparative correctness is not
absolute correctness.

## User Override

If the user's instructions conflict with any rule in this document, ask for
explicit confirmation before overriding. Only then execute their instructions.
