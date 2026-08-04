import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src')
const css = readFileSync(join(SRC, 'app.css'), 'utf8')

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/** @param {string} block */
function tokensIn(block) {
  return new Set([...block.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
}

/** @param {string} selector */
function blockFor(selector) {
  const start = css.indexOf(selector)
  if (start === -1) throw new Error(`missing block: ${selector}`)
  const open = css.indexOf('{', start)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}') {
      depth--
      if (depth === 0) return css.slice(open, i)
    }
  }
  throw new Error(`unterminated block: ${selector}`)
}

const rootTokens = tokensIn(blockFor(':root'))
const lightTokens = tokensIn(blockFor('[data-theme="light"]'))

/** WCAG relative luminance for a #rrggbb string. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Reads a literal hex value for a token out of a theme block. */
function hexOf(block, token) {
  const m = block.match(new RegExp(`${token}\\s*:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`${token} is not a literal hex in this block`)
  return m[1].toLowerCase()
}

describe('design tokens', () => {
  it('declares every token referenced by any component', () => {
    const files = walk(SRC).filter((f) => f.endsWith('.svelte') || f.endsWith('.css'))
    /** @type {Record<string, string[]>} */
    const missing = {}
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/var\((--[a-z0-9-]+)/g)) {
        if (!rootTokens.has(m[1])) {
          missing[m[1]] = (missing[m[1]] ?? []).concat(file.slice(SRC.length + 1))
        }
      }
    }
    expect(missing).toEqual({})
  })

  it('overrides every colour token in the light theme that the dark theme defines', () => {
    const colourish = /(bg|border|text|accent|success|error|warning|info|diff|glass|glow|shadow|neutral)/
    const darkColours = [...rootTokens].filter((t) => colourish.test(t))
    const notOverridden = darkColours.filter((t) => !lightTokens.has(t))
    expect(notOverridden).toEqual([])
  })

  it('keeps body text readable in both themes', () => {
    const dark = blockFor(':root')
    const light = blockFor('[data-theme="light"]')
    expect(contrast(hexOf(dark, '--text-primary'), hexOf(dark, '--bg-base'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(hexOf(dark, '--text-secondary'), hexOf(dark, '--bg-base'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(hexOf(light, '--text-primary'), hexOf(light, '--bg-base'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast(hexOf(light, '--text-secondary'), hexOf(light, '--bg-base'))).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps the signature accent usable as a UI colour in both themes', () => {
    expect(contrast(hexOf(blockFor(':root'), '--accent'), hexOf(blockFor(':root'), '--bg-base')))
      .toBeGreaterThanOrEqual(3)
    expect(contrast(hexOf(blockFor('[data-theme="light"]'), '--accent'), hexOf(blockFor('[data-theme="light"]'), '--bg-base')))
      .toBeGreaterThanOrEqual(3)
  })

  it('bans the banned hues from the accent ramp', () => {
    const banned = /#(8b5cf6|a78bfa|7c3aed|6366f1|3b82f6|2563eb)/i
    const accentLines = css.split('\n').filter((l) => /--accent[a-z-]*\s*:/.test(l))
    expect(accentLines.filter((l) => banned.test(l))).toEqual([])
  })
})
