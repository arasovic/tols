import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

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

  it('keeps social preview artwork on the achromatic brand palette', () => {
    const source = readFileSync(join(ROOT, 'static', 'og-image.svg'), 'utf8')

    expect(source).not.toMatch(/#ffb000/i)
    expect(source).toContain('translate(1274)')
    expect(source).toContain('STAYS LOCAL')
    expect(source).toContain('$ npm install -g tols-cli')
  })

  it('ships the achromatic social preview as a 1200x630 raster image', async () => {
    const { data, info } = await sharp(join(ROOT, 'static', 'og-image.png'))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    expect([info.width, info.height, info.channels]).toEqual([1200, 630, 3])

    let amberPixels = 0
    for (let offset = 0; offset < data.length; offset += info.channels) {
      const [red, green, blue] = data.subarray(offset, offset + info.channels)
      if (red >= 220 && green >= 120 && green <= 210 && blue <= 40) amberPixels += 1
    }
    expect(amberPixels).toBe(0)
  })

  it('uses GitHub theme sources in the repository README', () => {
    const source = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8')
    expect(source).toContain('<picture>')
    expect(source).toContain('media="(prefers-color-scheme: dark)" srcset="assets/brand/tols-wordmark-white.svg"')
    expect(source).toContain('media="(prefers-color-scheme: light)" srcset="assets/brand/tols-wordmark-black.svg"')
    expect(source).toContain('<img alt="tols" src="assets/brand/tols-wordmark-black.svg"')
  })

  it('keeps the npm wordmark independent from every host theme', () => {
    const npmWordmark = readFileSync(join(BRAND_ROOT, 'tols-wordmark.svg'), 'utf8')
    expect(npmWordmark).not.toContain('prefers-color-scheme')
    expect(npmWordmark).not.toContain('<style>')
    expect(npmWordmark).toMatch(/<rect[^>]+fill="#f4f4f0"/i)
    expect(npmWordmark).toContain('fill="#0a0a0a"')

    const source = readFileSync(join(REPO_ROOT, 'packages', 'tols', 'README.md'), 'utf8')
    expect(source).not.toContain('<picture>')
    expect(source.match(/<img alt="tols"/g), 'npm README needs one wordmark image').toHaveLength(1)
    expect(source).toContain('/main/assets/brand/tols-wordmark.svg')
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
