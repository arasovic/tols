import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const BUILD = join(DIR, '../build')
const APP_HTML = join(DIR, '../src/app.html')

/**
 * The single origin the site is served from. Every canonical, og:url and
 * JSON-LD provider URL has to agree with it.
 *
 * It is written here rather than imported because it is currently hardcoded in
 * the SEO config, which is what made the move off `arasovic.github.io` a
 * 38-file rewrite. Pinning it in the guard means the next drift is caught by a
 * failing test naming the file, not by someone noticing a stale URL in
 * production. Lifting it into `$lib/config/site.js` and importing it in both
 * places would be the real fix.
 */
const SITE_ORIGIN = 'https://tols.arasmehmet.com'

const CANONICAL = /rel="canonical"/g

/**
 * All 31 built pages. The tiles are flat `.html` files in build/ (barcode.html,
 * index.html), not build/<tool>/index.html directories. Every `.html` file in
 * build/ is a page the crawler will see: 30 tool pages plus the homepage.
 *
 * The test reads the built output rather than the source routes because the 30
 * per-tool routes collapsed into one `[tool]` route — there is no per-tool
 * source file left to enumerate. Reading build/ is also stronger: it asserts
 * what actually ships, not what the source intends.
 */
function builtPages() {
  return readdirSync(BUILD)
    .filter((f) => f.endsWith('.html'))
    .map((f) => join(BUILD, f))
}

// The route-derived assertions need a build. `npm test` must stay green without
// one, so the whole suite is skipped when build/ is absent rather than failed.
const hasBuild = existsSync(BUILD)

describe.skipIf(!hasBuild)('canonical URLs (built pages)', () => {
  it('are declared by the routes, never by the app shell', () => {
    // `app.html` renders into every page, and all page routes already declare
    // their own canonical in `<svelte:head>` — Svelte appends there, it does
    // not dedupe. A canonical in the shell therefore does not act as a
    // fallback: it ships a SECOND <link rel="canonical"> on every page, one of
    // them always pointing at the homepage. Search engines discard both when
    // they disagree. The build output had exactly this until the domain move,
    // and nothing failed, because no test read the head.
    expect(readFileSync(APP_HTML, 'utf8')).not.toMatch(/rel="canonical"/)
  })

  it('are declared exactly once by every built page', () => {
    // The other half of the contract: deleting the shell's tag only works if
    // no page is relying on it. A tool page added without a canonical fails
    // here rather than shipping an unindexed page. Counting, not presence:
    // a second canonical (e.g. one sneaked in by the shell) would otherwise
    // sail through.
    const offenders = builtPages()
      .map((file) => [file, (readFileSync(file, 'utf8').match(CANONICAL) || []).length])
      .filter(([, count]) => count !== 1)
      .map(([file, count]) => `${file.slice(BUILD.length + 1)}: ${count}`)
    expect(offenders).toEqual([])
  })

  it('all point at the configured site origin', () => {
    // Catches a partial revert of the domain move. Every absolute URL a page
    // hands to a crawler — canonical, og:image, the JSON-LD provider — must be
    // on the live origin; a leftover on the old GitHub Pages host would make
    // the page canonicalise itself away to a redirect.
    //
    // Only the <head> is checked. The body now carries the tool markup, which
    // is full of demo links (a JSONP sample calls api.example.com) and inline
    // SVGs whose xmlns is the w3.org namespace — none of it is crawler-facing
    // SEO. The canonical, og:* and JSON-LD tags all live in <head>.
    const offenders = builtPages().flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      const head = source.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? ''
      return (head.match(/https?:\/\/[^'"\s)]+/g) || [])
        .filter((url) => !url.startsWith(SITE_ORIGIN))
        .filter((url) => !url.startsWith('https://schema.org'))
        .map((url) => `${file.slice(BUILD.length + 1)}: ${url}`)
    })
    expect(offenders).toEqual([])
  })

  it('point og:image at a raster file, never at the SVG artwork', () => {
    // Every route shipped `og-image.svg` for months and no link preview
    // anywhere rendered an image, because Slack, Twitter, LinkedIn, Facebook
    // and iMessage all discard an og:image they cannot decode rather than
    // falling back to one they can. Nothing failed: the file existed, the URL
    // resolved, and the defect was only visible by pasting a link somewhere.
    const offenders = builtPages().flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      return (source.match(/https?:\/\/\S+\.svg/g) || []).map(
        (url) => `${file.slice(BUILD.length + 1)}: ${url}`
      )
    })
    expect(offenders).toEqual([])
  })

  it('counts a second tag rather than merely detecting one', () => {
    // The mutation the first two tests exist for: a page that keeps its own
    // canonical AND gets a second one back. A presence check (`toMatch`) passes
    // on this; only counting fails it.
    const mutation = '<link rel="canonical" href={canonicalUrl} />\n<link rel="canonical" href="/" />'
    expect((mutation.match(CANONICAL) || []).length).toBe(2)
  })
})