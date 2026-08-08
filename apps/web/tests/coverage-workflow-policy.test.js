import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const WORKFLOW_DIR = join(ROOT, '.github', 'workflows')
const WORKFLOWS = [
  ['PR Quality', readFileSync(join(WORKFLOW_DIR, 'pr-quality.yml'), 'utf8')],
  ['Pages deploy', readFileSync(join(WORKFLOW_DIR, 'deploy.yml'), 'utf8')],
  ['npm release', readFileSync(join(WORKFLOW_DIR, 'release.yml'), 'utf8')]
]
const QUALITY_GATE = [
  'npm ci',
  'npm run test:coverage',
  'npm run check',
  'npm run build',
  'npm run test:built'
]

function commands(source) {
  return [...source.matchAll(/^[ \t]*- run:[ \t]+(?!\|[ \t]*$)(.+)$/gm)].map((match) => match[1])
}

function qualityGate(source) {
  const workflowCommands = commands(source)
  const start = workflowCommands.indexOf('npm ci')
  return workflowCommands.slice(start, start + QUALITY_GATE.length)
}

describe('coverage shipping workflow policy', () => {
  it.each(WORKFLOWS)('%s runs the coverage gate exactly once', (_name, source) => {
    const workflowCommands = commands(source)

    expect(workflowCommands.filter((command) => command === 'npm run test:coverage')).toHaveLength(1)
    expect(workflowCommands).not.toContain('npm test')
    expect(qualityGate(source)).toEqual(QUALITY_GATE)
  })

  it('keeps the shared deploy and release quality gates aligned', () => {
    expect(qualityGate(WORKFLOWS[1][1])).toEqual(qualityGate(WORKFLOWS[2][1]))
  })
})
