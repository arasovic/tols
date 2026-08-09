# Contributing

Thanks for taking a look. This file covers the few conventions that are not
obvious from reading the code, so you do not have to discover them from a
failing test.

## Getting set up

```sh
npm install
npm run dev             # site on localhost
npm test                # fast local suites
npm run test:coverage   # pre-PR shipping gate
npm run check           # svelte-check
```

Development requires Node ^22.22.2, ^24.15.0, or >=26. CI and `.nvmrc` use
Node 24. Run `npm install` at the repository root to install both workspaces.
The published CLI has a separate Node >=20 runtime contract.

## The one rule that shapes everything

**The core must run in a browser.** Everything under `packages/tols/src/core/`
is imported by the CLI *and* bundled into the website, so it cannot use
`Buffer`, `node:fs`, or anything else that only exists in Node. Use `btoa` /
`atob` and `TextEncoder` / `TextDecoder` instead. Node specific work belongs in
the CLI adapter, not the core.

The published package also has **no runtime dependencies**, and it should stay
that way. Data files are fine, packages are not.

## Adding a tool

In order, a tool touches these responsibilities:

1. `packages/tols/src/core/<name>.js`: browser-safe logic.
2. `packages/tols/test/unit/<name>.test.js`: core behavior tests.
3. `packages/tols/src/tools/<name>.js`: CLI actions and flags.
4. `packages/tols/src/tools/index.js`: import and register the CLI adapter.
5. `apps/web/src/lib/config/registry.js`: web metadata.
6. `apps/web/src/lib/config/seo.js`: dynamic-route head metadata.
7. `apps/web/src/lib/tools/<Name>Tool.svelte`: UI adapter.
8. `apps/web/src/routes/(app)/[tool]/+page.js`: static lazy-import loader; no
   per-tool route directory.
9. `apps/web/src/lib/cli/templates.js`: only real CLI commands/actions.
10. Relevant CLI and web behavior tests.

Registry coverage, SEO coverage, route resolution, and CLI-command guards report
missing integration points.

Step 9 is checked against the real CLI by `apps/web/tests/cli-command.test.js`,
which imports every tool definition and fails if a template names a command that
does not exist. If you rename a CLI action, that test tells you.

## The guards

Several tests in `apps/web/tests/` do not render anything. They read the source
files and fail with a list of offending filenames: `layout`, `brand`, `fonts`,
`design-tokens`, `canonical`, and the `*-chrome` tests.

They exist because the site's shared primitives (`ToolShell`, `Panel`,
`FactStrip`, `ToolHeader`) were extracted from thirty tools that had each
hand-rolled the same chrome, and nothing stops a new tool from hand-rolling it
again. Rendering tests pass either way, so the guards read the source instead.

If one of them fails on your change, the usual fix is to use the primitive
rather than to work around the pattern it is looking for. If you are confident
the guard is wrong, say so in the pull request and change the guard in the same
commit, with a comment explaining what it now allows.

## Coverage

`npm run test:coverage` runs the CLI and web suites sequentially and enforces a
separate global floor for each workspace. New JavaScript and Svelte source is
included automatically. For normal feature work, add behavior tests and leave
the threshold configuration unchanged.

Codecov uploads the two CI-generated reports on pull requests and main
branch builds. It is informational during bootstrap and requires no local
login or upload command. Ordinary feature work does not edit codecov.yml;
change it only when a workspace or report boundary changes, or when the
reporting policy is deliberately reviewed.

Thresholds change only when the measured product boundary changes, such as a
new shipped source extension or a deliberate frontend rewrite. That change
needs a clean Node 24 baseline and must not use exclusions, skips, or per-file
exceptions to preserve an artificial percentage.

## Testing layout

**jsdom computes no layout.** `getBoundingClientRect` returns zeros for
everything, so no test in this repository can observe a spacing, overflow or
alignment defect. A green suite is not evidence that a layout change worked.

If you change spacing, grids or responsive behaviour, open the page in a browser
and check it, including at a narrow width. Say in the pull request that you did.

## Commits

Conventional commits, with a scope where one fits:

```
feat(ui): ...
fix(tols): ...
docs: ...
test(a11y): ...
```

Keep the subject line under 72 characters. If the change needs more explanation
than that, put it in the body, which is the right place for *why*. Several early
commits in this repository get this wrong; they are not the example to follow.

## Pull requests

Please make sure `npm run test:coverage` and `npm run check` both pass. CI runs
the coverage suites once on every pull request, and the site and CLI do not
ship below their independent global floors.

Describe what changed and how you verified it. If you fixed a bug, a test that
fails without the fix is worth more than a paragraph about it.
