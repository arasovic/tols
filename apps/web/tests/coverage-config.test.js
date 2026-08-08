import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const rootPackageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const webPackageJson = JSON.parse(
  readFileSync(join(root, 'apps', 'web', 'package.json'), 'utf8')
)
const viteConfig = readFileSync(join(root, 'apps', 'web', 'vite.config.js'), 'utf8')

const coverageBlock = `    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,svelte}'],
      reporter: ['text-summary', 'json-summary', 'lcov'],
      reportsDirectory: '../../coverage/web',
      thresholds: {
        statements: 87,
        branches: 71,
        functions: 88,
        lines: 87
      }
    },`

describe('web coverage configuration', () => {
  it('uses the Vitest-matched provider with coverage-only worker limits', () => {
    expect(webPackageJson.scripts['test:coverage']).toBe(
      'vitest --run --coverage --maxWorkers=50%'
    )
    expect(webPackageJson.devDependencies['@vitest/coverage-v8']).toBe('4.1.10')
    expect(webPackageJson.dependencies?.['@vitest/coverage-v8']).toBeUndefined()
  })

  it('includes all web sources and enforces global workspace floors', () => {
    expect(viteConfig).toContain(coverageBlock)
    expect(viteConfig).not.toContain('perFile:')
    expect(viteConfig).not.toContain('autoUpdate:')
  })

  it('runs the two workspace measurements sequentially from the root', () => {
    expect(rootPackageJson.scripts['test:coverage']).toBe(
      'npm run test:coverage -w packages/tols && npm run test:coverage -w apps/web'
    )
  })
})
