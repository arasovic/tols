import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const APP_HTML = join(dirname(fileURLToPath(import.meta.url)), '../src/app.html')

const CANONICAL = /rel="canonical"/g

/**
 * The half of the canonical contract that can be checked without a build.
 *
 * The other half — that every page ships exactly one canonical, on the right
 * origin, with a raster og:image — moved to `tests-built/` when the 30 tool
 * routes collapsed into one `[tool]` route, because there is no per-tool
 * source file left to enumerate and only the built output can answer it.
 * Those run under `npm run test:built`, after a build.
 *
 * These two do not need a build and must never be gated on one: a guard that
 * silently skips is worse than no guard, because the suite still reports
 * green.
 */
describe('canonical URLs (source)', () => {
  it('are declared by the routes, never by the app shell', () => {
    // `app.html` renders into every page, and the routes already declare their
    // own canonical in `<svelte:head>` — Svelte appends there, it does not
    // dedupe. A canonical in the shell therefore does not act as a fallback:
    // it ships a SECOND <link rel="canonical"> on every page, one of them
    // always pointing at the homepage. Search engines discard both when they
    // disagree. The build output had exactly this until the domain move, and
    // nothing failed, because no test read the head.
    expect(readFileSync(APP_HTML, 'utf8')).not.toMatch(/rel="canonical"/)
  })

  it('counts a second tag rather than merely detecting one', () => {
    // The mutation the built-page guard exists for: a page that keeps its own
    // canonical AND gets a second one back. A presence check (`toMatch`)
    // passes on this; only counting fails it.
    const mutation = '<link rel="canonical" href={canonicalUrl} />\n<link rel="canonical" href="/" />'
    expect((mutation.match(CANONICAL) || []).length).toBe(2)
  })
})
