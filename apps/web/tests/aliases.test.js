import { describe, it, expect } from 'vitest'
import { tools } from '$lib/config/registry.js'
import { TOOL_ALIASES, aliasFor } from '$lib/ui/aliases.js'

describe('tool aliases', () => {
  it('assigns every registry tool an alias', () => {
    for (const tool of tools) {
      expect(TOOL_ALIASES[tool.id]).toBeTruthy()
    }
  })

  it('never assigns the same alias to two different tools', () => {
    const aliases = Object.values(TOOL_ALIASES)
    expect(new Set(aliases).size).toBe(aliases.length)
  })

  it('gives json the unwidened two-letter alias and widens jsonp instead of duplicating', () => {
    expect(TOOL_ALIASES.json).toBe('js')
    expect(TOOL_ALIASES.jsonp).not.toBe('js')
    expect(TOOL_ALIASES.jsonp.startsWith('js')).toBe(true)
  })

  it('initialises the segments of a hyphenated id instead of widening from the CLI name', () => {
    // The old rule seeded from the CLI template's tool name, so `jwt` and
    // `jwt-encoder` both seeded `jwt` and registry order decided which got the
    // widened one: `jw` was the decoder while `jwt` was the *encoder*.
    expect(TOOL_ALIASES.jwt).toBe('jw')
    expect(TOOL_ALIASES['jwt-encoder']).toBe('je')
    expect(TOOL_ALIASES.css).toBe('cs')
    expect(TOOL_ALIASES['css-filter']).toBe('cf')
    expect(TOOL_ALIASES['data-uri']).toBe('du')
    expect(TOOL_ALIASES['base-converter']).toBe('bc')
  })

  it('never hands one tool an alias that is another tool spelled out', () => {
    // This is the property that "reads backwards" violates: `jwt` as the alias
    // of jwt-encoder, or `css` as the alias of css-filter, points a reader at
    // the tool whose id it actually is.
    const ids = new Set(tools.map((t) => t.id.replace(/-/g, '')))
    const offenders = Object.entries(TOOL_ALIASES)
      .filter(([id, alias]) => ids.has(alias) && alias !== id.replace(/-/g, ''))
      .map(([id, alias]) => `${id} -> ${alias}`)
    expect(offenders).toEqual([])
  })

  it('keeps every alias inside the fixed nav column', () => {
    // Sidebar.svelte sizes `.nav-alias` to a fixed 3ch so all 30 labels start
    // on the same column. A 4-character alias would silently re-ragged it.
    const tooWide = Object.entries(TOOL_ALIASES)
      .filter(([, alias]) => alias.length > 3)
      .map(([id, alias]) => `${id} -> ${alias}`)
    expect(tooWide).toEqual([])
  })

  it('derives an unknown id with the same rule rather than a different one', () => {
    expect(() => aliasFor('not-a-real-tool')).not.toThrow()
    expect(aliasFor('not-a-real-tool')).toBe('nart') // four segments, four initials
    expect(aliasFor('notarealtool')).toBe('no')
  })
})
