import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const WORKFLOW = join(ROOT, '.github/workflows/pr-quality.yml')
const source = readFileSync(WORKFLOW, 'utf8')
const CODECOV_ACTION =
  'codecov/codecov-action@fb8b3582c8e4def4969c97caa2f19720cb33a72f'

describe('pull request quality workflow', () => {
  it('uses pull_request with read-only repo access and OIDC identity', () => {
    expect(source).toMatch(/^on:\n  pull_request:\n    branches: \[main\]$/m)
    expect(source).not.toMatch(/\b(?:pull_request_target|workflow_run)\b/)
    expect(source).toMatch(/^permissions:\n  contents: read\n  id-token: write$/m)
    expect([...source.matchAll(/^[ \t]*permissions:/gm)]).toHaveLength(1)
    expect(
      [...source.matchAll(/^\s+([a-z-]+):\s+write$/gm)].map(
        (match) => match[1]
      )
    ).toEqual(['id-token'])
    expect(source).toMatch(/^concurrency:\n  group: pr-quality-\$\{\{ github\.event\.pull_request\.number \}\}\n  cancel-in-progress: true$/m)
  })

  it('runs the complete repository gate on Node 24', () => {
    const actions = [...source.matchAll(/^\s+(?:-\s+)?uses:\s+([^\s#]+)/gm)].map(
      (match) => match[1]
    )
    const commands = [...source.matchAll(/^\s+- run:\s+(.+)$/gm)].map((match) => match[1])

    expect(source).toMatch(/^  quality:\n    name: PR Quality\n    runs-on: ubuntu-latest\n    timeout-minutes: 15$/m)
    expect(actions).toEqual([
      'actions/checkout@v7',
      'actions/setup-node@v7',
      CODECOV_ACTION,
      CODECOV_ACTION
    ])
    expect(source).toMatch(/- uses: actions\/checkout@v7\n        with:\n          persist-credentials: false/)
    expect(source).toMatch(/- uses: actions\/setup-node@v7\n        with:\n          node-version: 24/)
    expect(commands).toEqual([
      'npm ci',
      'npm run test:coverage',
      'npm run check',
      'npm run build',
      'npm run test:built'
    ])
  })

  it('has no deployment, publication, secret, or repository write surface', () => {
    const privileged = [
      /\bsecrets\./,
      /^\s*environment:/m,
      /npm publish/,
      /actions\/(?:upload-pages-artifact|deploy-pages)/,
      /^\s+(?:pages|deployments|packages|pull-requests):/m,
      /github\.event\.pull_request\.head/
    ]

    expect(privileged.filter((pattern) => pattern.test(source))).toEqual([])
  })
})
