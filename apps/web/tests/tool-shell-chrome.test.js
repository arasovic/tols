import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const TOOLS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/lib/tools')
const TOOL_SHELL = join(dirname(fileURLToPath(import.meta.url)), '../src/lib/ui/ToolShell.svelte')

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

/**
 * Panel and ToolShell own the panel box chrome now. A tool that renders them
 * must declare no panel-box chrome of its own — neither the markup nor the CSS
 * rules, in any of the idioms the converted tools used to hand-roll (the
 * `panel` box, its `panel-header`/`panel-title`/`panel-badge`/`badge`/
 * `header-actions`/`output-header` header fragments, and the pair grids and
 * result wrappers that placed them).
 *
 * Each name is matched as a class *token*, not as a whole attribute or plain
 * rule: `class="panel"` and `class="panel content"` are the same
 * reintroduction, and an exact-match guard only catches the first. The CSS
 * pattern is `.name` followed by anything that is not a word character or a
 * hyphen, so `.panel:hover`, `.panel .child` and `.panel,` are all caught —
 * the `\.name\s*[,{]` form the earlier guards used walks past a descendant or
 * pseudo-class rule.
 *
 * The scan covers every tool component unconditionally, never only files that
 * mention ToolShell — a tool that hand-rolls the chrome AND drops the import
 * is still looked at, and the ON_TOOLSHELL list below cannot be satisfied by
 * keeping the chrome and dropping the shell.
 *
 * Deliberately NOT flagged: the classes that describe a panel's *contents* —
 * `.json-content`, `.highlighted-area`, `.diff-grid`, `.uuid-list`, `.token-value`,
 * `.output-content`, `.error-state` and the like. And `part-label` (the accent
 * inside the JWT decode panel titles) is not in the list either: `cron-part-label`
 * is a legitimate content label, and the token patterns would walk past it.
 */
const PANEL_CHROME_CLASSES = [
  // the box and its header fragments
  'panel',
  'panel-header',
  'panel-title',
  'panel-badge',
  'badge',
  'header-actions',
  'output-header',
  'char-count',
  // the pair grids and result containers that placed them
  'decoded-grid',
  'panels-grid',
  'panels',
  'jwt-inputs',
  'input-panel',
  'output-panel',
  'token-output',
  'token-header',
  'diff-split',
  'diff-panel',
  'diff-result',
  'result-header',
  'unified-result',
  'matches-list-card',
  'description-panel',
  'next-runs-panel'
]

const PANEL_CHROME_PATTERNS = PANEL_CHROME_CLASSES.flatMap((name) => [
  new RegExp(`class="[^"]*\\b${name}(?![\\w-])`),
  new RegExp(`class:${name}(?![\\w-])`),
  new RegExp(`\\.${name}(?![\\w-])`)
])

/**
 * The renamed reintroduction: a panel-pair grid under a wrapper that none of
 * the class patterns above know. The pane guard catches the two-pane grid by
 * its structural signature (`grid-template-columns`); the panel pair is the
 * same idea.
 *
 * Matched by what the track list *means*, not by how it is spelled. Listing the
 * spellings was this guard's own hole: it named `1fr 1fr` and PanelGroup's
 * `repeat(2, minmax(0, 1fr))`, and a full renamed panel pair written
 * `repeat(2, 1fr)` — the shortest way anyone actually types a two-column grid —
 * walked straight past it. Verified before the fix: it passed silently.
 */
const TWO_EQUAL_COLUMNS = [
  /^(1fr|minmax\(0, ?1fr\)) (1fr|minmax\(0, ?1fr\))$/,
  /^repeat\( ?2 ?, ?(1fr|minmax\(0, ?1fr\)) ?\)$/
]

/**
 * Declarations inside an `@media` block are exempt. A panel pair collapses at
 * narrow widths, it does not appear there, so a two-column rule under a media
 * query is a legitimate small-screen layout — CronTool's examples grid drops to
 * `repeat(2, 1fr)` on phones and is not a reintroduced pair. Brace depth rather
 * than a regex, because the declarations inside a media block are otherwise
 * indistinguishable from the ones outside it.
 *
 * @param {string} source
 * @returns {string[]} the offending track lists
 */
function panelPairGrids(source) {
  const hits = []
  const mediaDepths = new Set()
  let depth = 0
  let pendingMedia = false

  for (let i = 0; i < source.length; i++) {
    if (source.startsWith('@media', i)) {
      pendingMedia = true
    } else if (source[i] === '{') {
      depth++
      if (pendingMedia) {
        mediaDepths.add(depth)
        pendingMedia = false
      }
    } else if (source[i] === '}') {
      mediaDepths.delete(depth)
      depth--
    } else if (mediaDepths.size === 0 && source.startsWith('grid-template-columns', i)) {
      const decl = /grid-template-columns\s*:\s*([^;}]+)/y
      decl.lastIndex = i
      const match = decl.exec(source)
      if (!match) continue
      const tracks = match[1].trim().replace(/\s+/g, ' ')
      if (TWO_EQUAL_COLUMNS.some((pattern) => pattern.test(tracks))) hits.push(tracks)
    }
  }
  return hits
}

const ON_TOOLSHELL = [
  'BarcodeTool.svelte',
  'BaseConverterTool.svelte',
  'ColorTool.svelte',
  'CronTool.svelte',
  'CssFilterTool.svelte',
  'DataUriTool.svelte',
  'DiffTool.svelte',
  'HashTool.svelte',
  'GzipTool.svelte',
  'JsonpTool.svelte',
  'JwtEncoderTool.svelte',
  'JwtTool.svelte',
  'LoremTool.svelte',
  'PasswordTool.svelte',
  'PlaceholderTool.svelte',
  'QrcodeTool.svelte',
  'RegexTool.svelte',
  'TimestampTool.svelte',
  'TimezoneTool.svelte',
  'UnicodeTool.svelte',
  'UrlTool.svelte',
  'UuidTool.svelte'
]

describe('panel box chrome', () => {
  it('keeps command, work surface, and action rail contiguous', () => {
    const source = readFileSync(TOOL_SHELL, 'utf8')
    const block = source.match(/\.tool-shell\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(block).toMatch(/gap:\s*0/)
  })

  it('is owned by Panel and ToolShell, not by the tool components', () => {
    // Rendering the tools would pass even if one reintroduced its own panel
    // boxes inside the ToolShell slot, so — like the <main>, header, pane and
    // fact-strip guards — this reads the sources instead and names the offender.
    const offenders = walk(TOOLS_DIR)
      .filter((f) => f.endsWith('.svelte'))
      .filter((f) => {
        const source = readFileSync(f, 'utf8')
        return PANEL_CHROME_PATTERNS.some((pattern) => pattern.test(source))
      })
      .map((f) => f.slice(TOOLS_DIR.length + 1))
    expect(offenders).toEqual([])
  })

  it('is what the converted tools render — they cannot opt back out of it', () => {
    // The check above proves nobody kept their OWN chrome, which a tool that
    // neither renders ToolShell nor hand-rolls a panel box also satisfies. The
    // list is explicit: these own a panel-box layout, so each must
    // render it through the shell. A tool that reintroduces the chrome under
    // renamed classes (invisible to the scan above) AND drops the import fails
    // here.
    const missing = ON_TOOLSHELL.filter(
      (name) => !/<ToolShell\b/.test(readFileSync(join(TOOLS_DIR, name), 'utf8'))
    )
    expect(missing).toEqual([])
  })

  it('catches the box-and-header idiom as a class token among others', () => {
    // Each of the four guards before this one shipped with a hole; the first
    // was an exact-attribute pattern that `class="x wide"` walks past. The
    // added `output-header` guard is a token pattern, so the interesting
    // mutation is the box header reintroduced as one of several classes on the
    // same element — `class="result output-header"` — which the exact-match
    // form would miss and this one catches.
    const mutation = 'class="result output-header"'
    expect(PANEL_CHROME_PATTERNS.some((pattern) => pattern.test(mutation))).toBe(true)
  })

  it('does not come back as a renamed panel-pair grid', () => {
    // The first two tests catch the historical names and the shell contract.
    // What they cannot see is a reintroduction written with fresh wrapper
    // names — the hole the pane guard closed with its structural signature.
    //
    // Scoped to files that render two or more `<Panel>` elements, because a
    // two-equal-column track list is not by itself evidence of anything: a
    // checkbox pair, a from/to time picker and a filter control grid are all
    // written `repeat(2, 1fr)` and none of them is a panel pair. Without this
    // scope the guard reported those as offenders, and the fix applied to them
    // was to rewrite the *product* CSS to `repeat(auto-fit, minmax(…))` — the
    // tool bending to the test. A tool that has several panels is the one that
    // owes their placement to PanelGroup, and that is the only place the track
    // list is evidence.
    const offenders = ON_TOOLSHELL.flatMap((name) => {
      const source = readFileSync(join(TOOLS_DIR, name), 'utf8')
      if ((source.match(/<Panel\b/g) || []).length < 2) return []
      return panelPairGrids(source).map((tracks) => `${name}: grid-template-columns: ${tracks}`)
    })
    expect(offenders).toEqual([])
  })
})
