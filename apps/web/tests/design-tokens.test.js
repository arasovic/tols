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

function channelSpread(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return Math.max(...channels) - Math.min(...channels)
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
      // A property the file declares itself — PanelGroup sets
      // --panel-group-columns from a prop via an inline style — is a local
      // variable, not a design token, and app.css has no business knowing its
      // name. What this guard is for is a reference to a property that nothing
      // declares anywhere, which is still caught: the declaration has to exist
      // in the same file or in :root.
      const localProps = new Set([...src.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]))
      for (const m of src.matchAll(/var\((--[a-z0-9-]+)/g)) {
        if (!rootTokens.has(m[1]) && !localProps.has(m[1])) {
          missing[m[1]] = (missing[m[1]] ?? []).concat(file.slice(SRC.length + 1))
        }
      }
    }
    expect(missing).toEqual({})
  })

  it('overrides every literal colour the dark theme defines', () => {
    // Detect colours by value, not by name: a name-based regex substring-matches
    // --text-xs and --shadow-md and would force dead redeclarations into the
    // light block. Alias tokens (var(--x)) and non-colours are correctly skipped.
    const dark = blockFor(':root')
    const hasColourValue = (token) => {
      const m = dark.match(new RegExp(`${token}\\s*:\\s*([^;]+);`))
      return m ? /#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(/.test(m[1]) : false
    }
    const notOverridden = [...rootTokens].filter((t) => hasColourValue(t) && !lightTokens.has(t))
    expect(notOverridden).toEqual([])
  })

  it('keeps toasts stacked above the search overlay', () => {
    // Toast.svelte uses --z-popover, SearchOverlay.svelte uses --z-modal.
    // A copy toast fired from the command palette must not hide behind it.
    const dark = blockFor(':root')
    const z = (token) => Number(dark.match(new RegExp(`${token}\\s*:\\s*(\\d+)`))[1])
    expect(z('--z-popover')).toBeGreaterThan(z('--z-modal'))
  })

  // Every rung of the text ramp that renders body text, against every background
  // body text is painted on. --text-disabled is excluded on purpose: WCAG 1.4.3
  // exempts inactive controls, and holding it to 4.5:1 would make disabled state
  // indistinguishable from enabled. Everything else is in.
  const BODY_TEXT_TOKENS = ['--text-primary', '--text-secondary', '--text-tertiary', '--text-muted']
  // --bg-elevated is not optional: app.css's global `code` rule paints it, so
  // .tool-cmd and every inline <code> sit on it, and in dark it is the tightest
  // of the three. Checking only base and surface is what let --text-muted ship
  // at 2.53:1 on 35 tool cards.
  const TEXT_BACKGROUNDS = ['--bg-base', '--bg-surface', '--bg-elevated']

  it('keeps body text readable on every background in both themes', () => {
    /** @type {string[]} */
    const failures = []
    for (const [theme, block] of [
      ['dark', blockFor(':root')],
      ['light', blockFor('[data-theme="light"]')]
    ]) {
      for (const token of BODY_TEXT_TOKENS) {
        for (const bg of TEXT_BACKGROUNDS) {
          const r = contrast(hexOf(block, token), hexOf(block, bg))
          if (r < 4.5) failures.push(`${theme} ${token} on ${bg}: ${r.toFixed(2)}:1`)
        }
      }
    }
    expect(failures).toEqual([])
  })

  it('keeps the text ramp monotonic so muted stays quieter than tertiary', () => {
    // A token can be pushed over 4.5:1 and still be wrong: if --text-muted ends up
    // with more contrast than --text-tertiary the ramp inverts and "muted" is no
    // longer muted. Ordering is by contrast against --bg-base, which is direction-
    // agnostic and so holds for both themes.
    for (const [theme, block] of [
      ['dark', blockFor(':root')],
      ['light', blockFor('[data-theme="light"]')]
    ]) {
      const bg = hexOf(block, '--bg-base')
      const ratios = BODY_TEXT_TOKENS.map((t) => contrast(hexOf(block, t), bg))
      const sorted = [...ratios].sort((a, b) => b - a)
      expect(ratios, `${theme} text ramp is not monotonically decreasing`).toEqual(sorted)
    }
  })

  it('uses an achromatic UI accent with sufficient contrast in both themes', () => {
    for (const block of [blockFor(':root'), blockFor('[data-theme="light"]')]) {
      const accent = hexOf(block, '--accent')
      expect(channelSpread(accent)).toBeLessThanOrEqual(4)
      expect(contrast(accent, hexOf(block, '--bg-base'))).toBeGreaterThanOrEqual(3)
    }
  })

  it('reserves amber for warnings instead of decorative chrome', () => {
    for (const block of [blockFor(':root'), blockFor('[data-theme="light"]')]) {
      const warning = hexOf(block, '--warning')
      expect(channelSpread(warning)).toBeGreaterThan(32)
      expect(warning).not.toBe(hexOf(block, '--accent'))
      expect(contrast(warning, hexOf(block, '--bg-base'))).toBeGreaterThanOrEqual(3)
    }
  })

  it('bans the banned hues from the accent ramp', () => {
    const banned = /#(8b5cf6|a78bfa|7c3aed|6366f1|3b82f6|2563eb)/i
    const accentLines = css.split('\n').filter((l) => /--accent[a-z-]*\s*:/.test(l))
    expect(accentLines.filter((l) => banned.test(l))).toEqual([])
  })

  it('gives every shorthand that uses a motion token an explicit easing', () => {
    // The --transition-* tokens carry a duration only. A transition/animation
    // shorthand that ends a segment on one of them falls back to the CSS default
    // `ease`, silently discarding the designed --ease-out curve.
    const files = walk(SRC).filter((f) => f.endsWith('.svelte') || f.endsWith('.css'))
    const timingFn = /^(?:var\(--ease-[a-z-]+\)|cubic-bezier\([^)]*\)|ease-in-out|ease-in|ease-out|ease|linear|steps\([^)]*\)|step-start|step-end)$/

    /** @type {string[]} */
    const offenders = []
    for (const file of files) {
      const src = readFileSync(file, 'utf8')
      const rel = file.slice(SRC.length + 1)
      for (const m of src.matchAll(/(?:^|[\s;}])(transition|animation)\s*:/g)) {
        let i = m.index + m[0].length
        let depth = 0
        while (i < src.length) {
          if (src[i] === '(') depth++
          if (src[i] === ')') depth--
          if (depth === 0 && (src[i] === ';' || src[i] === '}')) break
          i++
        }
        const value = src.slice(m.index + m[0].length, i)
        if (!value.includes('--transition')) continue
        const line = src.slice(0, m.index).split('\n').length
        for (const t of value.matchAll(/var\(--transition(?:-[a-z]+)?\)/g)) {
          const next = value.slice(t.index + t[0].length).trim().match(/^[^,\s]+(?:\([^)]*\))?/)?.[0] ?? ''
          if (!timingFn.test(next)) {
            offenders.push(`${rel}:${line}: ${value.trim()}`)
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
