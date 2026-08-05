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

  it('degrades an unknown id to its own first two characters without throwing', () => {
    expect(() => aliasFor('not-a-real-tool')).not.toThrow()
    expect(aliasFor('not-a-real-tool')).toBe('no')
  })
})
