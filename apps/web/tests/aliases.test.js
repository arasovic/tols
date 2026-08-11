import { describe, it, expect } from 'vitest'
import { tools } from '$lib/config/registry.js'
import {
  TOOL_ALIASES,
  aliasFor,
  overrideProblems,
  MAX_ALIAS_LENGTH
} from '$lib/ui/aliases.js'

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
    // SearchOverlay.svelte sizes `.result-alias` to a fixed 3ch so all labels start
    // on the same column. A 4-character alias would silently re-ragged it.
    expect(MAX_ALIAS_LENGTH).toBe(3)
    const tooWide = Object.entries(TOOL_ALIASES)
      .filter(([, alias]) => alias.length > MAX_ALIAS_LENGTH)
      .map(([id, alias]) => `${id} -> ${alias}`)
    expect(tooWide).toEqual([])
  })

  it('derives an unknown id with the same rule rather than a different one', () => {
    expect(() => aliasFor('not-a-real-tool')).not.toThrow()
    expect(aliasFor('not-a-real-tool')).toBe('nart') // four segments, four initials
    expect(aliasFor('notarealtool')).toBe('no')
  })
})

describe('alias overrides', () => {
  it('applies the hand-written aliases the ladder cannot reach', () => {
    // `timestamp` and `timezone` share four leading characters and neither has
    // a hyphen to initialise, so the ladder can only truncate to `ti`/`tim`.
    // `jsonp` sits behind `json` and truncates to `jso`.
    expect(TOOL_ALIASES.timestamp).toBe('ts')
    expect(TOOL_ALIASES.timezone).toBe('tz')
    expect(TOOL_ALIASES.jsonp).toBe('jsp')
  })

  it('leaves every derived alias alone', () => {
    // Reserving an override frees the rungs it displaced (`ti`, `tim`, `jso`),
    // and a later tool could pick one up. Pinned so that stays a decision.
    const derivedNow = Object.fromEntries(
      Object.entries(TOOL_ALIASES).filter(
        ([id]) => !['timestamp', 'timezone', 'jsonp'].includes(id)
      )
    )
    expect(derivedNow).toEqual({
      json: 'js',
      yaml: 'ya',
      xml: 'xm',
      html: 'ht',
      markdown: 'ma',
      regex: 're',
      diff: 'di',
      sql: 'sq',
      base64: 'ba',
      url: 'ur',
      jwt: 'jw',
      'jwt-encoder': 'je',
      gzip: 'gz',
      'data-uri': 'du',
      uuid: 'uu',
      hash: 'ha',
      lorem: 'lo',
      qrcode: 'qr',
      barcode: 'bar',
      password: 'pa',
      placeholder: 'pl',
      color: 'co',
      'base-converter': 'bc',
      cron: 'cr',
      unicode: 'un',
      css: 'cs',
      'css-filter': 'cf'
    })
  })

  it('has no problem in the shipped table', () => {
    expect(overrideProblems()).toEqual([])
  })

  // The table is a second source of truth, so each way it can drift from the
  // registry is checked against a deliberately broken table — otherwise the
  // guard above only proves today's entries happen to be fine.
  it('names an override for an id the registry does not have', () => {
    expect(overrideProblems({ 'no-such-tool': 'ns' })).toEqual([
      'override "no-such-tool" -> "ns": the registry has no tool with id "no-such-tool"'
    ])
  })

  it('names two overrides claiming the same alias', () => {
    expect(overrideProblems({ timestamp: 'tz', timezone: 'tz' })).toEqual([
      'override "timezone" -> "tz": collides with override "timestamp" -> "tz"'
    ])
  })

  it('names an override that takes an alias another tool derives', () => {
    expect(overrideProblems({ timezone: 'ha' })).toEqual([
      'override "timezone" -> "ha": "ha" is the alias "hash" derives on its own'
    ])
  })

  it('names an override the ladder already produces', () => {
    expect(overrideProblems({ timezone: 'tim' })).toEqual([
      'override "timezone" -> "tim": redundant, the derivation ladder already produces "tim"'
    ])
  })

  it('names an override too wide for the nav column', () => {
    expect(overrideProblems({ timezone: 'tzone' })).toEqual([
      `override "timezone" -> "tzone": 5 characters does not fit the ${MAX_ALIAS_LENGTH}ch nav column`
    ])
  })
})
