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

describe('brand', () => {
  it('has no DevUtils references left in the app source', () => {
    // This used to carry an allowlist: YamlTool and MarkdownTool kept DevUtils
    // in their example payloads because Phase A could not touch lib/tools/
    // while the CLI branch was rewriting those same <script> blocks. Phase B
    // has landed, the payloads say tols, and the allowlist is gone, so the
    // check is now absolute. An allowlist nobody prunes is a leak.
    const offenders = walk(join(ROOT, 'src'))
      .filter((f) => /\.(svelte|js|html|css)$/.test(f))
      .filter((f) => readFileSync(f, 'utf8').includes('DevUtils'))
      .map((f) => f.slice(ROOT.length + 1))
    expect(offenders).toEqual([])
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
      // Both: the PNG is what og:image points at, because no social platform
      // rasterises an SVG preview, and the SVG is the artwork that
      // scripts/generate-icons.js renders it from.
      'og-image.svg',
      'og-image.png'
    ]) {
      expect(existsSync(join(ROOT, 'static', asset)), `${asset} missing`).toBe(true)
    }
  })
})
