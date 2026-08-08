import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const WORKFLOW = join(ROOT, '.github/workflows/dependency-review.yml')
const source = readFileSync(WORKFLOW, 'utf8')

describe('dependency review workflow', () => {
  it('uses the unprivileged pull_request event with least token access', () => {
    expect(source).toMatch(/^on:\n  pull_request:\n    branches: \[main\]$/m)
    expect(source).not.toMatch(/^\s{2}(?:push|schedule|workflow_dispatch):/m)
    expect(source).not.toMatch(/\b(?:pull_request_target|workflow_run|workflow_call)\b/)
    expect(source).not.toMatch(/^\s+(?:paths|paths-ignore):/m)
    expect(source).toMatch(/^permissions:\n  contents: read$/m)
    expect([...source.matchAll(/^[ \t]*permissions:/gm)]).toHaveLength(1)
    expect(source).not.toMatch(/^\s+[a-z-]+:\s+write\s*$/m)
    expect(source).toMatch(/^concurrency:\n  group: dependency-review-\$\{\{ github\.event\.pull_request\.number \}\}\n  cancel-in-progress: true$/m)
  })

  it('runs the official action as the stable Dependency Review check', () => {
    const actions = [...source.matchAll(/^\s+- uses:\s+(.+)$/gm)].map((match) => match[1])
    const commands = [...source.matchAll(/^\s+- run:\s+(.+)$/gm)].map((match) => match[1])

    expect(source).toMatch(/^  review:\n    name: Dependency Review\n    runs-on: ubuntu-latest\n    timeout-minutes: 10$/m)
    expect(actions).toEqual([
      'actions/checkout@v7',
      'actions/dependency-review-action@v5'
    ])
    expect(commands).toEqual([])
    expect(source).toMatch(/- uses: actions\/checkout@v7\n        with:\n          persist-credentials: false/)
  })

  it('blocks new moderate vulnerabilities in every dependency scope', () => {
    expect(source).toMatch(/- uses: actions\/dependency-review-action@v5\n        with:\n          fail-on-severity: moderate\n          fail-on-scopes: "runtime, development, unknown"\n          license-check: false\n          show-openssf-scorecard: false\n          show-patched-versions: true/)
    expect(source).not.toMatch(/^\s+warn-only:/m)
    expect(source).not.toMatch(/^\s+vulnerability-check:\s+false\s*$/m)
  })

  it('has no write, secret, deployment, exception, or ref override surface', () => {
    const privileged = [
      /\bsecrets\./,
      /^\s*environment:/m,
      /^\s+(?:pages|id-token|deployments|packages|pull-requests):/m,
      /^\s+(?:repo-token|external-repo-token|comment-summary-in-pr|base-ref|head-ref|config-file):/m,
      /^\s+(?:allow-ghsas|allow-licenses|deny-licenses|allow-dependencies-licenses|deny-packages|deny-groups):/m,
      /github\.event\.pull_request\.head/,
      /actions\/(?:upload|deploy)/
    ]

    expect(privileged.filter((pattern) => pattern.test(source))).toEqual([])
  })
})
