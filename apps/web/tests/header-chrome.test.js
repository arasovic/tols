import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/lib/tools')

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/**
 * ToolHeader owns the page heading now. A tool component must render it via
 * `<ToolHeader toolId="..." />` and declare no heading chrome of its own —
 * neither the markup nor the CSS rules, in either of the two idioms that used
 * to coexist (the `tool-header` block and the boxed `tool-bar` with an inline
 * SVG icon). The actions move into the `actions` slot, so `tool-actions` is
 * caught too. `tool-crosslink` is deliberately excluded: it is a functional
 * cross-tool link on the two JWT tools, not replicable page chrome.
 */
const CHROME_CLASSES = [
  // tool-header idiom
  'tool-header',
  'tool-meta',
  'tool-name',
  'tool-desc',
  // tool-bar idiom
  'tool-bar',
  'tool-title',
  'tool-title-text',
  'tool-icon',
  // shared — the actions container
  'tool-actions'
]

/**
 * Matched as a class *token* rather than as the whole attribute, because
 * `class="tool-header"` and `class="tool-header wide"` are the same
 * reintroduction and an exact-match test only catches the first — a full
 * duplicate header block sitting next to the real one passes it.
 */
const CHROME_PATTERNS = CHROME_CLASSES.flatMap((name) => [
  new RegExp(`class="[^"]*\\b${name}\\b`),
  new RegExp(`class:${name}\\b`),
  new RegExp(`\\.${name}\\s*[,{]`)
])

describe('tool header chrome', () => {
  it('is owned by ToolHeader, not by the tool components', () => {
    // Rendering the shells would pass even if a tool reintroduced its own
    // heading inside the ToolHeader slot, so — like the <main> guard — this
    // reads the sources instead and names the offender.
    const offenders = walk(TOOLS_DIR)
      .filter((f) => f.endsWith('.svelte'))
      .filter((f) => {
        const source = readFileSync(f, 'utf8')
        return CHROME_PATTERNS.some((pattern) => pattern.test(source))
      })
      .map((f) => f.slice(TOOLS_DIR.length + 1))
    expect(offenders).toEqual([])
  })

  it('is rendered by every tool component', () => {
    // The check above only proves nobody kept their OWN chrome, which a tool
    // that renders no heading at all also satisfies. Each tool page owes the
    // document exactly one <h1>, and ToolHeader is where it comes from.
    const missing = walk(TOOLS_DIR)
      .filter((f) => f.endsWith('.svelte'))
      .filter((f) => !/<ToolHeader\b/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(TOOLS_DIR.length + 1))
    expect(missing).toEqual([])
  })
})