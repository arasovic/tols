import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const ACTION = 'codecov/codecov-action@fb8b3582c8e4def4969c97caa2f19720cb33a72f'
const CONFIG = readFileSync(join(ROOT, 'codecov.yml'), 'utf8')
const PR = readFileSync(join(ROOT, '.github/workflows/pr-quality.yml'), 'utf8')
const DEPLOY = readFileSync(join(ROOT, '.github/workflows/deploy.yml'), 'utf8')
const RELEASE = readFileSync(join(ROOT, '.github/workflows/release.yml'), 'utf8')

const EXPECTED_CONFIG = [
  'codecov:',
  '  notify:',
  '    after_n_builds: 2',
  '',
  'coverage:',
  '  status:',
  '    project:',
  '      default:',
  '        informational: true',
  '    patch:',
  '      default:',
  '        informational: true',
  '',
  'comment:',
  '  require_changes: true',
  '  after_n_builds: 2',
  '',
  'github_checks:',
  '  annotations: false',
  '',
  'flags:',
  '  cli:',
  '    paths:',
  '      - packages/tols/',
  '    carryforward: false',
  '  web:',
  '    paths:',
  '      - apps/web/',
  '    carryforward: false',
  ''
].join('\n')

const CLI_UPLOAD = [
  '      - name: Upload CLI coverage',
  '        continue-on-error: true',
  '        uses: ' + ACTION + ' # v7.0.0',
  '        with:',
  '          use_oidc: true',
  '          fail_ci_if_error: false',
  '          disable_search: true',
  '          files: coverage/cli/lcov.info',
  '          flags: cli',
  '          name: cli',
  '          root_dir: packages/tols',
  '          network_prefix: packages/tols/',
  ''
].join('\n')

const WEB_UPLOAD = [
  '      - name: Upload web coverage',
  '        continue-on-error: true',
  '        uses: ' + ACTION + ' # v7.0.0',
  '        with:',
  '          use_oidc: true',
  '          fail_ci_if_error: false',
  '          disable_search: true',
  '          files: coverage/web/lcov.info',
  '          flags: web',
  '          name: web',
  '          root_dir: apps/web',
  '          network_prefix: apps/web/',
  ''
].join('\n')

function occurrences(source, needle) {
  return source.split(needle).length - 1
}

describe('Codecov policy', () => {
  it('locks the exact informational repository policy', () => {
    expect(CONFIG).toBe(EXPECTED_CONFIG)
  })

  it.each([
    ['PR Quality', PR],
    ['Pages deploy', DEPLOY]
  ])('%s uploads the two reports once after the coverage verdict', (_name, source) => {
    expect(source).toContain(
      '      - run: npm run test:coverage\n' +
        CLI_UPLOAD +
        WEB_UPLOAD +
        '      - run: npm run check'
    )
    expect(occurrences(source, ACTION)).toBe(2)
    expect(occurrences(source, CLI_UPLOAD)).toBe(1)
    expect(occurrences(source, WEB_UPLOAD)).toBe(1)
  })

  it('keeps Codecov out of the release path', () => {
    expect(RELEASE).not.toContain('codecov/')
    expect(RELEASE).not.toContain('coverage/cli/lcov.info')
    expect(RELEASE).not.toContain('coverage/web/lcov.info')
  })

  it('uses OIDC without secrets, tokens, or ref overrides', () => {
    const surface = [CONFIG, PR, DEPLOY].join('\n')

    expect(surface).not.toMatch(/\bsecrets\./)
    expect(surface).not.toMatch(/\bCODECOV_TOKEN\b/)
    expect(surface).not.toMatch(/^\s+token:/m)
    expect(PR).not.toMatch(/^\s+(?:override_|slug:|url:)/m)
    expect(PR).toMatch(/^permissions:\n  contents: read\n  id-token: write$/m)
    expect(DEPLOY).toMatch(
      /^permissions:\n  contents: read\n  pages: write\n  id-token: write$/m
    )
    expect(DEPLOY).toMatch(
      /- uses: actions\/checkout@v7\n        with:\n          persist-credentials: false/
    )
    expect(PR + DEPLOY).not.toMatch(/^\s+env:/m)
  })
})
