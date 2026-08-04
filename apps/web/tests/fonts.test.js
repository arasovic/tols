import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(ROOT, 'src', 'app.css'), 'utf8')
const html = readFileSync(join(ROOT, 'src', 'app.html'), 'utf8')

const FILES = [
  'CommitMono-400-Regular.woff2',
  'CommitMono-700-Regular.woff2',
  'MartianMono-CnRg.woff2',
  'MartianMono-CnBd.woff2'
]

describe('typography', () => {
  it('makes no third-party font requests', () => {
    expect(css).not.toMatch(/fonts\.googleapis\.com/)
    expect(css).not.toMatch(/@import\s+url\(/)
    expect(html).not.toMatch(/fonts\.(googleapis|gstatic)\.com/)
  })

  it('ships every declared font file', () => {
    for (const f of FILES) {
      const p = join(ROOT, 'static', 'fonts', f)
      expect(existsSync(p), `${f} is missing`).toBe(true)
      expect(statSync(p).size).toBeGreaterThan(1000)
    }
  })

  it('declares a @font-face for each shipped file with font-display: swap', () => {
    const faces = css.match(/@font-face\s*\{[^}]*\}/g) ?? []
    expect(faces.length).toBe(FILES.length)
    for (const f of FILES) {
      const face = faces.find((block) => block.includes(f))
      expect(face, `no @font-face references ${f}`).toBeTruthy()
      expect(face).toMatch(/font-display:\s*swap/)
    }
  })

  it('ships the OFL licence text for both families', () => {
    expect(existsSync(join(ROOT, 'static', 'fonts', 'LICENSE-CommitMono.txt'))).toBe(true)
    expect(existsSync(join(ROOT, 'static', 'fonts', 'LICENSE-MartianMono.txt'))).toBe(true)
  })
})
