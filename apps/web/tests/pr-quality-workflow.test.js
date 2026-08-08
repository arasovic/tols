import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const WORKFLOW = join(ROOT, '.github/workflows/pr-quality.yml')
const source = readFileSync(WORKFLOW, 'utf8')

describe('pull request quality workflow', () => {
  it('uses the unprivileged pull_request event with least token access', () => {
    expect(source).toMatch(/^on:\n  pull_request:\n    branches: \[main\]$/m)
    expect(source).not.toMatch(/\b(?:pull_request_target|workflow_run)\b/)
    expect(source).toMatch(/^permissions:\n  contents: read$/m)
    expect([...source.matchAll(/^[ \t]*permissions:/gm)]).toHaveLength(1)
    expect(source).not.toMatch(/^\s+[a-z-]+:\s+write\s*$/m)
    expect(source).toMatch(/^concurrency:\n  group: pr-quality-\$\{\{ github\.event\.pull_request\.number \}\}\n  cancel-in-progress: true$/m)
  })

  it('runs the complete repository gate on Node 24', () => {
    const actions = [...source.matchAll(/^\s+- uses:\s+(.+)$/gm)].map((match) => match[1])
    const commands = [...source.matchAll(/^\s+- run:\s+(.+)$/gm)].map((match) => match[1])

    expect(source).toMatch(/^  quality:\n    name: PR Quality\n    runs-on: ubuntu-latest\n    timeout-minutes: 15$/m)
    expect(actions).toEqual(['actions/checkout@v7', 'actions/setup-node@v7'])
    expect(source).toMatch(/- uses: actions\/checkout@v7\n        with:\n          persist-credentials: false/)
    expect(source).toMatch(/- uses: actions\/setup-node@v7\n        with:\n          node-version: 24/)
    expect(commands).toEqual([
      'npm ci',
      'npm test',
      'npm run check',
      'npm run build',
      'npm run test:built'
    ])
  })

  it('has no deployment, publication, secret, or environment surface', () => {
    const privileged = [
      /\bsecrets\./,
      /^\s*environment:/m,
      /npm publish/,
      /actions\/(?:upload-pages-artifact|deploy-pages)/,
      /^\s+(?:pages|id-token|deployments|packages|pull-requests):/m,
      /github\.event\.pull_request\.head/
    ]

    expect(privileged.filter((pattern) => pattern.test(source))).toEqual([])
  })
})
