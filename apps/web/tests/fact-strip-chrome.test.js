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
 * FactStrip owns the label:value fact row now. A tool that shows such a strip
 * must render it via `<FactStrip facts={...}>` and declare no strip chrome of
 * its own — neither the markup nor the CSS rules.
 *
 * Two namespaces are guarded. The historical `info-*` classes (plus
 * DataUriTool's one-off `file-info` container) are what the ten tools used to
 * hand-roll; the `fact-*` classes are FactStrip's own, so a tool that copies
 * the primitive's markup into itself instead of rendering it is caught too.
 *
 * Each name is matched as a class *token*, not as a whole attribute or plain
 * rule: `class="info-bar"` and `class="info-bar wide"` are the same
 * reintroduction, and an exact-match guard only catches the first. The CSS
 * pattern is `.name` followed by anything that is not a word character or a
 * hyphen, so `.info-bar:hover`, `.fact-strip .fact` and `.info-bar,` are all
 * caught — the `\.name\s*[,{]` form that the earlier guards used walks past
 * a descendant or pseudo-class rule.
 *
 * The scan covers every tool component unconditionally, never only files that
 * mention FactStrip: the second pane guard shipped with just that hole — a
 * tool that hand-rolls the chrome AND drops the import is never looked at.
 */
const STRIP_CHROME_CLASSES = [
  // what the hand-rolled strips used to call themselves
  'info-bar',
  'info-item',
  'info-label',
  'info-value',
  'file-info',
  // FactStrip's own classes — the primitive is the only legitimate owner
  'fact-strip',
  'fact',
  'fact-label',
  'fact-sep',
  'fact-value',
  'fact-mono',
  'fact-badge',
  'fact-badge-accent',
  'fact-badge-info',
  'fact-badge-success'
]

const STRIP_CHROME_PATTERNS = STRIP_CHROME_CLASSES.flatMap((name) => [
  new RegExp(`class="[^"]*\\b${name}(?![\\w-])`),
  new RegExp(`class:${name}(?![\\w-])`),
  new RegExp(`\\.${name}(?![\\w-])`)
])

describe('fact strip chrome', () => {
  it('is owned by FactStrip, not by the tool components', () => {
    // Rendering the tools would pass even if one reintroduced its own strip
    // inside the FactStrip slot, so — like the <main>, header and pane
    // guards — this reads the sources instead and names the offender.
    const offenders = walk(TOOLS_DIR)
      .filter((f) => f.endsWith('.svelte'))
      .filter((f) => {
        const source = readFileSync(f, 'utf8')
        return STRIP_CHROME_PATTERNS.some((pattern) => pattern.test(source))
      })
      .map((f) => f.slice(TOOLS_DIR.length + 1))
    expect(offenders).toEqual([])
  })

  it('is what the ten strip tools render — they cannot opt back out of it', () => {
    // The check above proves nobody kept their OWN chrome, which a tool that
    // neither renders FactStrip nor hand-rolls a strip also satisfies. The
    // list is explicit: these ten own a fact strip, so each must render it
    // through the primitive. A tool that reintroduces the chrome under
    // renamed classes (invisible to the scan above) AND drops the import
    // fails here instead.
    const ON_FACT_STRIP = [
      'Base64Tool.svelte',
      'ColorTool.svelte',
      'DataUriTool.svelte',
      'HashTool.svelte',
      'JwtTool.svelte',
      'LoremTool.svelte',
      'RegexTool.svelte',
      'TimestampTool.svelte',
      'UrlTool.svelte',
      'UuidTool.svelte'
    ]
    const missing = ON_FACT_STRIP.filter(
      (name) => !/<FactStrip\b/.test(readFileSync(join(TOOLS_DIR, name), 'utf8'))
    )
    expect(missing).toEqual([])
  })
})