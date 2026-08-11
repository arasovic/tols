import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../src')
const TOOLS_DIR = join(SRC, 'lib', 'tools')
const toolFiles = readdirSync(TOOLS_DIR)
  .filter(name => name.endsWith('.svelte'))
  .map(name => join(TOOLS_DIR, name))

function styleOf(file) {
  const blocks = [...readFileSync(file, 'utf8').matchAll(/<style>([\s\S]*?)<\/style>/g)]
  return blocks.at(-1)?.[1] ?? ''
}

describe('redesign contract', () => {
  it('joins every tool identity to its work surface without a card gap', () => {
    const offenders = toolFiles.flatMap(file => {
      const style = styleOf(file)
      const block = style.match(/\.tool\s*\{([^}]*)\}/)?.[1] ?? ''
      return /gap:\s*0\s*;/.test(block) ? [] : [file.split('/').pop()]
    })
    expect(offenders).toEqual([])
  })

  it('uses square shared geometry rather than card rounding', () => {
    const css = readFileSync(join(SRC, 'app.css'), 'utf8')
    for (const token of ['--radius-sm', '--radius', '--radius-md', '--radius-lg']) {
      expect(css).toMatch(new RegExp(`${token}\\s*:\\s*0px`))
    }
  })

  it('keeps hardcoded colours out of tool styles except required white media', () => {
    const offenders = toolFiles.flatMap(file => {
      const style = styleOf(file)
      return style.split('\n').flatMap((line, index) => {
        if (!/(#[0-9a-f]{3,8}|rgba?\()/i.test(line)) return []
        if (/canvas|media-white/.test(line) && /white|#fff(?:fff)?/i.test(line)) return []
        if (file.endsWith('ColorTool.svelte') && /#808080/i.test(line)) return []
        return [`${file.split('/').pop()}:${index + 1}: ${line.trim()}`]
      })
    })
    expect(offenders).toEqual([])
  })

  it('does not restore decorative elevation inside tool styles', () => {
    const offenders = toolFiles.flatMap(file => {
      const style = styleOf(file)
      return [...style.matchAll(/([^{}]+)\{([^{}]*box-shadow:\s*var\(--shadow(?:-[a-z]+)?\)[^{}]*)\}/g)]
        .filter(([, selector]) => !/canvas/.test(selector))
        .map(([, selector]) => `${file.split('/').pop()}: ${selector.trim()}`)
    })
    expect(offenders).toEqual([])
  })
})
