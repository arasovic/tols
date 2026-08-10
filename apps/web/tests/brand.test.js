import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = join(ROOT, '..', '..')
const BRAND_ROOT = join(REPO_ROOT, 'assets', 'brand')

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
      'favicon-16x16.svg',
      'favicon-32x32.svg',
      'favicon-16x16.png',
      'favicon-32x32.png',
      'apple-touch-icon.png',
      'safari-pinned-tab.svg',
      // Both: the PNG is what og:image points at, because no social platform
      // rasterises an SVG preview, and the SVG is the artwork that
      // scripts/generate-icons.js renders it from.
      'og-image.svg',
      'og-image.png'
    ]) {
      expect(existsSync(join(ROOT, 'static', asset)), `${asset} missing`).toBe(true)
    }
  })

  it('uses the full wordmark instead of the retired dollar favicon', () => {
    for (const asset of ['favicon.svg', 'favicon-16x16.svg', 'favicon-32x32.svg']) {
      const source = readFileSync(join(ROOT, 'static', asset), 'utf8')
      expect(source, `${asset} still uses amber`).not.toMatch(/#ffb000/i)
      expect(source, `${asset} does not contain the full wordmark`).toContain('translate(1274 0)')
    }

    const shell = readFileSync(join(ROOT, 'src', 'app.html'), 'utf8')
    expect(shell).toContain('href="%sveltekit.assets%/safari-pinned-tab.svg" color="#0a0a0a"')
    expect(shell).not.toMatch(/mask-icon[^>]+#ffb000/i)
  })

  it('keeps the README wordmark visible when picture sources are stripped', () => {
    const adaptiveWordmark = readFileSync(join(BRAND_ROOT, 'tols-wordmark.svg'), 'utf8')
    expect(adaptiveWordmark).toContain('@media (prefers-color-scheme: dark)')
    expect(adaptiveWordmark).toMatch(/fill:\s*#0a0a0a/i)
    expect(adaptiveWordmark).toMatch(/fill:\s*#f4f4f0/i)

    for (const readme of [
      join(REPO_ROOT, 'README.md'),
      join(REPO_ROOT, 'packages', 'tols', 'README.md')
    ]) {
      const source = readFileSync(readme, 'utf8')
      expect(source, `${readme} relies on a stripped picture source`).not.toContain('<picture>')
      expect(source.match(/<img alt="tols"/g), `${readme} needs one wordmark image`).toHaveLength(1)
    }
  })

  it('keeps the site wordmark independent from the system color scheme', () => {
    const fixedBlackPath = join(BRAND_ROOT, 'tols-wordmark-black.svg')
    expect(existsSync(fixedBlackPath), 'fixed black wordmark missing').toBe(true)

    const fixedBlackWordmark = readFileSync(fixedBlackPath, 'utf8')
    expect(fixedBlackWordmark).toContain('fill="#0a0a0a"')
    expect(fixedBlackWordmark).not.toContain('prefers-color-scheme')

    const homepage = readFileSync(join(ROOT, 'src', 'routes', '+page.svelte'), 'utf8')
    expect(homepage).toContain("tols-wordmark-black.svg?url")
    expect(homepage).not.toContain("tols-wordmark.svg?url")
  })
})
