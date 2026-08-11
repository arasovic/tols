import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')
const source = readFileSync(join(ROOT, '.github/workflows/release.yml'), 'utf8')

function job(name) {
  const start = source.indexOf(`  ${name}:\n`)
  if (start === -1) return ''
  const rest = source.slice(start + name.length + 4)
  const next = rest.search(/^  [a-z][a-z-]+:\n/m)
  return next === -1
    ? source.slice(start)
    : source.slice(start, start + name.length + 4 + next)
}

describe('npm release workflow', () => {
  it('isolates npm identity from repository write access', () => {
    const publish = job('publish')

    expect(source).not.toMatch(/^permissions:/m)
    expect(publish).toMatch(
      /^    permissions:\n      contents: read\n      id-token: write$/m,
    )
    expect(publish).not.toMatch(/^      contents: write$/m)
  })

  it('creates a release only after publish with least privilege', () => {
    const release = job('github-release')

    expect(release).toMatch(/^    needs: publish$/m)
    expect(release).toMatch(/^    permissions:\n      contents: write$/m)
    expect(release).not.toMatch(/id-token:|npm publish|uses:/)
    expect(release).toContain('GH_TOKEN: ${{ github.token }}')
    expect(release).toContain('TAG: ${{ github.ref_name }}')
  })

  it('verifies or creates the exact public release contract', () => {
    const release = job('github-release')

    expect(release).toContain('gh release view "$TAG"')
    expect(release).toContain('--json tagName,name,isDraft,isPrerelease')
    expect(release).toContain(
      'release.tagName !== process.env.EXPECTED_TAG',
    )
    expect(release).toContain(
      'release.name !== process.env.EXPECTED_TITLE',
    )
    expect(release).toContain('release.isDraft')
    expect(release).toContain('release.isPrerelease')
    expect(release).toContain('gh release create "$TAG"')
    expect(release).toContain('--verify-tag')
    expect(release).toContain('--generate-notes')
    expect(release).toContain('--title "$expected_title"')
  })
})
