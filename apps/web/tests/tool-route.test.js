import { describe, it, expect } from 'vitest'
import { load } from '../src/routes/(app)/[tool]/+page.js'
import { seo } from '../src/lib/config/seo.js'
import { tools } from '../src/lib/config/registry.js'

/**
 * `load()` resolves the URL segment to a tool id, and everything downstream —
 * the lazy component import and the `<head>` — is keyed off that one value.
 *
 * The tests below assert the resolution, not any particular URL spelling. If
 * the flat-file build ever stops serving `/xml.html`, deleting the strip is a
 * one-line change and only the second case here goes with it.
 */
describe('the [tool] route resolves one id', () => {
  it('hands the page the same id it loaded the component for', async () => {
    const result = await load({ params: { tool: 'xml' } })
    expect(result.id).toBe('xml')
    expect(result.component).toBeTruthy()
  })

  it('resolves the flat file GitHub Pages also serves to the same tool', async () => {
    // adapter-static writes build/xml.html, so /xml.html answers 200 and
    // cannot be redirected away by a file server. Landing there used to
    // render the prerendered page and then replace it with a 404 on
    // hydration, because the raw param is "xml.html".
    const result = await load({ params: { tool: 'xml.html' } })
    expect(result.id).toBe('xml')
  })

  it('404s an unknown slug in either spelling', async () => {
    // Not "renders an empty shell": a typo must not become an indexable page
    // carrying a valid-looking canonical.
    await expect(load({ params: { tool: 'xmll' } })).rejects.toMatchObject({ status: 404 })
    await expect(load({ params: { tool: 'xmll.html' } })).rejects.toMatchObject({ status: 404 })
  })

  it('resolves every registered tool to a head entry', async () => {
    // The join that matters: whatever `load()` returns must key into seo.js,
    // or the page ships with no title and no canonical.
    const missing = []
    for (const tool of tools) {
      const result = await load({ params: { tool: tool.id } })
      if (!seo[result.id]) missing.push(tool.id)
    }
    expect(missing).toEqual([])
  })
})
