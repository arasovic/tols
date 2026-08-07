import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const BUILD = join(dirname(fileURLToPath(import.meta.url)), '../build')

/**
 * The single origin the site is served from. Every canonical, og:url and
 * JSON-LD provider URL has to agree with it.
 *
 * It is written here rather than imported because it is currently hardcoded in
 * `$lib/config/seo.js`, which is what made the move off `arasovic.github.io` a
 * 38-file rewrite. Pinning it in the guard means the next drift is caught by a
 * failing test naming the file, not by someone noticing a stale URL in
 * production. Lifting it into `$lib/config/site.js` and importing it in both
 * places would be the real fix.
 */
const SITE_ORIGIN = 'https://tols.arasmehmet.com'

const CANONICAL = /rel="canonical"/g

/**
 * All 31 built pages. They are flat `.html` files in `build/` — `xml.html`,
 * `index.html` — not `build/<tool>/index.html` directories. Every `.html` file
 * in `build/` is a page a crawler will see.
 *
 * Reading the built output is what makes this guard stronger than the source
 * read it replaced: it asserts what actually ships, not what the source
 * intends. It is also the only option left, since the 30 per-tool routes
 * collapsed into one `[tool]` route.
 */
function builtPages() {
  return readdirSync(BUILD)
    .filter((f) => f.endsWith('.html'))
    .map((f) => join(BUILD, f))
}

/**
 * These assertions need a build, which is why they live outside `tests/` and
 * run under their own config — `npm test` stays build-free.
 *
 * They must NOT skip when the build is missing. An earlier version of this
 * guard wrapped everything in `describe.skipIf(!existsSync(BUILD))`, which
 * looked harmless locally: a developer with a stale `build/` saw five passing
 * tests. In CI it was always dead, because `npm test` runs before
 * `npm run build` and `build/` is gitignored — so on the only machine whose
 * verdict ships, the guard covering this repo's two most expensive shipped
 * bugs never ran at all.
 */
describe('canonical URLs (built pages)', () => {
  it('has a build to check', () => {
    // Fails, never skips. `npm run test:built` runs after `npm run build`; if
    // the build is absent, the guard has not run and the caller must know.
    expect(
      existsSync(BUILD),
      `No build at ${BUILD}. Run \`npm run build\` first — these assertions read the built pages.`
    ).toBe(true)
    expect(builtPages().length).toBe(31)
  })

  it('are declared exactly once by every built page', () => {
    // The other half of the contract: deleting the shell's tag only works if
    // no page is relying on it. A tool page added without a canonical fails
    // here rather than shipping an unindexed page. Counting, not presence: a
    // second canonical sneaked in by the shell would otherwise sail through.
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
    // Only the <head> is checked. The built body carries the tool markup,
    // which is full of demo links (a JSONP sample calls api.example.com) and
    // inline SVGs whose xmlns is the w3.org namespace — none of it
    // crawler-facing. The canonical, og:* and JSON-LD tags all live in <head>.
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
})
