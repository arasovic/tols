import { describe, it, expect } from 'vitest'
import { tools } from '../src/lib/config/registry.js'
import { seo } from '../src/lib/config/seo.js'

/**
 * `registry.js` lists the tools; `seo.js` carries the `<head>` metadata for
 * each one. The `[tool]` route reads both, and its `{#if toolSeo}` renders
 * nothing at all when the entry is missing — no title, no canonical, no
 * og:tags.
 *
 * Before the collapse this could not happen: adding a tool meant creating a
 * route file, and the route file was where the metadata lived. Now the two
 * lists can drift, and drift is silent — the page still builds, still renders
 * the tool, and ships unindexable.
 *
 * The built-page guard would catch a missing canonical, but only under
 * `npm run test:built`, after a build. This catches it in the normal suite,
 * naming the tool.
 */
describe('seo.js covers the registry', () => {
  it('has an entry for every tool', () => {
    const missing = tools.filter((tool) => !seo[tool.id]).map((tool) => tool.id)
    expect(missing).toEqual([])
  })

  it('has no entry for a tool that no longer exists', () => {
    // The other direction. An orphan is harmless at runtime but means the two
    // files disagree, and the next person cannot tell which one is stale.
    const ids = new Set(tools.map((tool) => tool.id))
    const orphans = Object.keys(seo).filter((id) => !ids.has(id))
    expect(orphans).toEqual([])
  })

  it('gives every entry the seven fields the head template reads', () => {
    // A partially filled entry is worse than a missing one: `{#if toolSeo}`
    // passes, and the page ships with `content="undefined"` in a meta tag.
    const offenders = []
    for (const tool of tools) {
      const entry = seo[tool.id]
      if (!entry) continue
      for (const key of ['pageTitle', 'pageDescription', 'canonicalUrl', 'ogImage', 'keywords', 'name']) {
        if (typeof entry[key] !== 'string' || entry[key].trim() === '') {
          offenders.push(`${tool.id}.${key}`)
        }
      }
      if (!Array.isArray(entry.featureList) || entry.featureList.length === 0) {
        offenders.push(`${tool.id}.featureList`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('describes Unicode as single-codepoint inspection and common-table search', () => {
    const entry = seo.unicode
    const publicCopy = [entry.pageDescription, ...entry.featureList].join(' ')
    expect(publicCopy).toContain('single Unicode code point')
    expect(publicCopy).toContain('common-character table')
    expect(entry.featureList).toContain('Single-codepoint inspection')
    expect(entry.featureList).toContain('Common-character search')
    expect(publicCopy).not.toContain('Block information')
    expect(publicCopy).not.toContain('Multi-character analysis')
  })

  it('derives each canonical from the tool id', () => {
    // A copy-paste of the wrong canonical points a page at another tool and
    // deindexes it. This is the failure the flat seo.js makes easy and the old
    // per-directory routes made obvious.
    const offenders = tools
      .filter((tool) => seo[tool.id])
      .filter((tool) => seo[tool.id].canonicalUrl !== `https://tols.arasmehmet.com/${tool.id}`)
      .map((tool) => `${tool.id}: ${seo[tool.id].canonicalUrl}`)
    expect(offenders).toEqual([])
  })
})
