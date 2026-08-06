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
 * Workbench owns the two-pane layout now. A tool on that shape must render the
 * grid, the pane boxes and the pane headers via `<Workbench>` and declare no
 * pane chrome of its own — neither the markup nor the CSS rules, in any of the
 * four idioms the converted tools used to hand-roll (the `workspace` grid, the
 * `editor` pane box, the `editor-header`/`editor-label`/`editor-meta`/`char-count`
 * pane header fragments).
 *
 * The pane box `editor` is matched as a class token with a lookahead so the
 * kept `editor-textarea` content class is not flagged: `editor` followed by
 * `-textarea` is pane content, ` editor` delimited by whitespace or a quote is
 * chrome.
 *
 * Deliberately NOT flagged: `output-display`, `error-display`, `editor-textarea`
 * (pane *contents*), and the tool-specific readouts that survived conversion —
 * MarkdownTool's `html-output` source view, Base64Tool's `info-bar` stats strip,
 * HtmlTool's `options-bar`. Those are single supplementary regions, not the
 * stdin/stdout pane shape this guard protects.
 *
 * Class-name matching alone is how the previous header guard shipped with a
 * hole: a reintroduced grid written with renamed wrappers passes an exact
 * match. `grid-template-columns` is the structural signature of a two-column
 * pane grid no matter what the wrapper is called, so it is caught too.
 */
const PANE_CHROME_CLASSES = ['workspace', 'editor-header', 'editor-label', 'editor-meta', 'char-count']

/**
 * `class="[^"]*\bname(?![\w-])` matches the class as a token but not as a
 * prefix of a longer class (`editor` must not flag `editor-textarea`).
 * `\.name\s*[,{]` matches the CSS rule, never a class that merely starts with
 * the name. `grid-template-columns` catches a renamed reintroduction.
 */
const PANE_CHROME_PATTERNS = [
  ...PANE_CHROME_CLASSES.flatMap((name) => [
    new RegExp(`class="[^"]*\\b${name}(?![\\w-])`),
    new RegExp(`class:${name}(?![\\w-])`),
    new RegExp(`\\.${name}\\s*[,{]`)
  ]),
  // The pane box itself — precise so `editor-textarea` is exempt.
  new RegExp(`class="[^"]*\\beditor(?![\\w-])`),
  new RegExp(`class:editor(?![\\w-])`),
  new RegExp(`\\.editor\\s*[,{]`),
  // A two-column grid written any other way.
  new RegExp(`grid-template-columns`)
]

describe('pane chrome', () => {
  it('is owned by Workbench, not by the tools that render it', () => {
    // Rendering the shells would pass even if a tool reintroduced its own two
    // panes inside the Workbench slots, so — like the <main> and header guards —
    // this reads the sources of the Workbench-rendering tools and names the
    // offender.
    const offenders = walk(TOOLS_DIR)
      .filter((f) => f.endsWith('.svelte'))
      .filter((f) => /\bWorkbench\b/.test(readFileSync(f, 'utf8')))
      .filter((f) => {
        const source = readFileSync(f, 'utf8')
        return PANE_CHROME_PATTERNS.some((pattern) => pattern.test(source))
      })
      .map((f) => f.slice(TOOLS_DIR.length + 1))
    expect(offenders).toEqual([])
  })

  it('is what these tools render — they cannot opt back out of it', () => {
    // The check above is scoped to files that mention Workbench, which is the
    // hole: a tool that hand-rolls its panes AND drops the import passes it
    // silently. Verified — a component with a full two-pane grid and no
    // mention of Workbench raises nothing. So name the tools that owe the
    // shape. The list is explicit because the other tools legitimately are not
    // on it yet; it disappears into "every tool" when Phase B finishes.
    const ON_WORKBENCH = [
      'Base64Tool.svelte',
      'CssTool.svelte',
      'HtmlTool.svelte',
      'JsonTool.svelte',
      'MarkdownTool.svelte',
      'SqlTool.svelte',
      'XmlTool.svelte',
      'YamlTool.svelte'
    ]
    const missing = ON_WORKBENCH.filter(
      (name) => !/<Workbench\b/.test(readFileSync(join(TOOLS_DIR, name), 'utf8'))
    )
    expect(missing).toEqual([])
  })
})