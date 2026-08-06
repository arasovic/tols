# Contributing

Thanks for taking a look. This file covers the few conventions that are not
obvious from reading the code, so you do not have to discover them from a
failing test.

## Getting set up

```sh
npm install
npm run dev      # site on localhost
npm test         # both suites
npm run check    # svelte-check
```

Node 20 or newer. The repository is an npm workspace with two packages, and
`npm install` at the root installs both.

## The one rule that shapes everything

**The core must run in a browser.** Everything under `packages/tols/src/core/`
is imported by the CLI *and* bundled into the website, so it cannot use
`Buffer`, `node:fs`, or anything else that only exists in Node. Use `btoa` /
`atob` and `TextEncoder` / `TextDecoder` instead. Node specific work belongs in
the CLI adapter, not the core.

The published package also has **no runtime dependencies**, and it should stay
that way. Data files are fine, packages are not.

## Adding a tool

A tool touches seven files. In order:

1. `packages/tols/src/core/<name>.js`: the actual logic, as plain functions.
2. `packages/tols/test/unit/<name>.test.js`: tests for those functions.
3. `packages/tols/src/tools/<name>.js`: the CLI adapter, a default export
   carrying `name`, `aliases`, `actions` and flag parsing.
4. `packages/tols/src/tools/index.js`: import and register it.
5. `apps/web/src/lib/config/registry.js`: id, name, description, category,
   icon. Every surface on the site derives from this entry: the homepage grid,
   the sidebar, `⌘K` search, the page title and the sitemap.
6. `apps/web/src/routes/(app)/<id>/+page.svelte`: the route. Copy an existing
   one; it carries the canonical URL, the Open Graph tags and the JSON-LD block.
7. `apps/web/src/lib/cli/templates.js`: which CLI tool and actions the page's
   command strip should render.

Step 7 is checked against the real CLI by `apps/web/tests/cli-command.test.js`,
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

Please make sure `npm test` and `npm run check` both pass. CI runs them on every
push and the site does not deploy if either fails.

Describe what changed and how you verified it. If you fixed a bug, a test that
fails without the fix is worth more than a paragraph about it.
