import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../src')
const APP_HTML = join(SRC, 'app.html')
const ROUTES = join(SRC, 'routes')

/**
 * The single origin the site is served from. Every canonical, og:url and
 * JSON-LD provider URL has to agree with it.
 *
 * It is written here rather than imported because it is currently hardcoded in
 * all 31 page routes, which is what made the move off `arasovic.github.io` a
 * 38-file rewrite. Pinning it in the guard means the next drift is caught by a
 * failing test naming the file, not by someone noticing a stale URL in
 * production. Lifting it into `$lib/config/site.js` and importing it in both
 * places would be the real fix.
 */
const SITE_ORIGIN = 'https://tols.arasmehmet.com'

const CANONICAL = /rel="canonical"/g

function pageRoutes() {
  const nested = readdirSync(join(ROUTES, '(app)'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(ROUTES, '(app)', e.name, '+page.svelte'))
  return [join(ROUTES, '+page.svelte'), ...nested]
}

describe('canonical URLs', () => {
  it('are declared by the routes, never by the app shell', () => {
    // `app.html` renders into every page, and all 31 routes already declare
    // their own canonical in `<svelte:head>` — Svelte appends there, it does
    // not dedupe. A canonical in the shell therefore does not act as a
    // fallback: it ships a SECOND <link rel="canonical"> on every page, one of
    // them always pointing at the homepage. Search engines discard both when
    // they disagree. The build output had exactly this until the domain move,
    // and nothing failed, because no test read the head.
    expect(readFileSync(APP_HTML, 'utf8')).not.toMatch(/rel="canonical"/)
  })

  it('are declared exactly once by every page route', () => {
    // The other half of the contract: deleting the shell's tag only works if
    // no route is relying on it. A new tool route added without a canonical
    // fails here rather than shipping an unindexed page.
    const offenders = pageRoutes()
      .map((file) => [file, (readFileSync(file, 'utf8').match(CANONICAL) || []).length])
      .filter(([, count]) => count !== 1)
      .map(([file, count]) => `${file.slice(SRC.length + 1)}: ${count}`)
    expect(offenders).toEqual([])
  })

  it('all point at the configured site origin', () => {
    // Catches a partial revert of the domain move. Every absolute URL a route
    // hands to a crawler — canonical, og:image, the JSON-LD provider — must be
    // on the live origin; a leftover on the old GitHub Pages host would make
    // the page canonicalise itself away to a redirect.
    const offenders = pageRoutes().flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      return (source.match(/https?:\/\/[^'"\s)]+/g) || [])
        .filter((url) => !url.startsWith(SITE_ORIGIN))
        .filter((url) => !url.startsWith('https://schema.org'))
        .map((url) => `${file.slice(SRC.length + 1)}: ${url}`)
    })
    expect(offenders).toEqual([])
  })

  it('point og:image at a raster file, never at the SVG artwork', () => {
    // Every route shipped `og-image.svg` for months and no link preview
    // anywhere rendered an image, because Slack, Twitter, LinkedIn, Facebook
    // and iMessage all discard an og:image they cannot decode rather than
    // falling back to one they can. Nothing failed: the file existed, the URL
    // resolved, and the defect was only visible by pasting a link somewhere.
    const offenders = pageRoutes().flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      return (source.match(/https?:\/\/\S+\.svg/g) || []).map(
        (url) => `${file.slice(SRC.length + 1)}: ${url}`
      )
    })
    expect(offenders).toEqual([])
  })

  it('counts a second tag rather than merely detecting one', () => {
    // The mutation the first two tests exist for: a route that keeps its own
    // canonical AND gets a second one back. A presence check (`toMatch`) passes
    // on this; only counting fails it.
    const mutation = '<link rel="canonical" href={canonicalUrl} />\n<link rel="canonical" href="/" />'
    expect((mutation.match(CANONICAL) || []).length).toBe(2)
  })
})
