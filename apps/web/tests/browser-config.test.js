import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'

const rootPackage = JSON.parse(readFileSync('../../package.json', 'utf8'))
const webPackage = JSON.parse(readFileSync('package.json', 'utf8'))

describe('browser test configuration', () => {
  it('pins Playwright and exposes root and workspace commands', () => {
    expect(webPackage.devDependencies?.['@playwright/test']).toBe('1.62.1')
    expect(webPackage.scripts?.['test:browser']).toBe('playwright test')
    expect(rootPackage.scripts?.['test:browser']).toBe('npm run test:browser -w apps/web')
  })

  it('owns a deterministic local Chromium configuration', () => {
    expect(existsSync('playwright.config.js')).toBe(true)
    const source = existsSync('playwright.config.js')
      ? readFileSync('playwright.config.js', 'utf8')
      : ''

    expect(source).toContain("browserName: 'chromium'")
    expect(source).toContain("trace: 'on-first-retry'")
    expect(source).toContain("screenshot: 'only-on-failure'")
    expect(source).toContain("snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}.png'")
    expect(source).toContain('width: 1440, height: 900')
    expect(source).toContain('width: 390, height: 844')
    expect(source).toContain('reuseExistingServer: false')
    expect(source).toContain('127.0.0.1:4178')
    expect(source).toContain('npm run build && npm run preview')
  })

  it('limits seeded randomness to visual tests', () => {
    const helpers = readFileSync('tests-browser/helpers.js', 'utf8')
    const visual = readFileSync('tests-browser/visual.spec.js', 'utf8')
    const smoke = readFileSync('tests-browser/tool-smoke.spec.js', 'utf8')

    expect(helpers).toContain('{ deterministic = false }')
    expect(visual).toContain('{ deterministic: true }')
    expect(smoke).not.toContain('deterministic: true')
  })
})
