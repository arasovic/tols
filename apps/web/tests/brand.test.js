import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const p = join(dir, entry)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })
}

// Phase A must not touch lib/tools/ — feat/tols is rewriting those <script>
// blocks and has already changed their output behaviour, so editing a one-word
// example payload there would buy a merge conflict in the worst possible place.
// These two keep their DevUtils example payloads until Phase B converts them.
// JsonTool is NOT on this list: Task 10 sanctions editing it.
const DEFERRED_TO_PHASE_B = ['src/lib/tools/YamlTool.svelte', 'src/lib/tools/MarkdownTool.svelte']

describe('brand', () => {
  it('has no DevUtils references left in the app source', () => {
    const offenders = walk(join(ROOT, 'src'))
      .filter((f) => /\.(svelte|js|html|css)$/.test(f))
      .filter((f) => readFileSync(f, 'utf8').includes('DevUtils'))
      .map((f) => f.slice(ROOT.length + 1))
      .filter((f) => !DEFERRED_TO_PHASE_B.includes(f))
    expect(offenders).toEqual([])
  })

  // Pins the debt: if Phase B rebrands these, this test fails and the
  // allowlist above must shrink. An allowlist nobody prunes is a leak.
  it('still carries exactly the deferred DevUtils payloads', () => {
    for (const file of DEFERRED_TO_PHASE_B) {
      expect(readFileSync(join(ROOT, file), 'utf8'), `${file} rebranded`).toContain('DevUtils')
    }
  })

  it('does not reference the retired violet in app.html', () => {
    expect(readFileSync(join(ROOT, 'src', 'app.html'), 'utf8')).not.toMatch(/8b5cf6/i)
  })

  it('ships every icon asset', () => {
    for (const asset of [
      'favicon.svg',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'apple-touch-icon.png',
      'og-image.svg'
    ]) {
      expect(existsSync(join(ROOT, 'static', asset)), `${asset} missing`).toBe(true)
    }
  })
})
