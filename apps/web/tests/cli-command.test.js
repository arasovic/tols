// apps/web/tests/cli-command.test.js
import { describe, it, expect } from 'vitest'
import { buildCommand, INLINE_LIMIT } from '$lib/cli/command.js'
import { templateFor } from '$lib/cli/templates.js'
import { tools } from '$lib/config/registry.js'

describe('buildCommand', () => {
  it('renders tool, action and a simple inline input', () => {
    expect(buildCommand({ tool: 'json', action: 'fmt', input: '{"a":1}' }))
      .toBe(`tols json fmt '{"a":1}'`)
  })

  it('omits quotes for inputs with no shell-significant characters', () => {
    expect(buildCommand({ tool: 'base64', action: 'enc', input: 'merhaba' }))
      .toBe('tols base64 enc merhaba')
  })

  it('escapes embedded single quotes', () => {
    expect(buildCommand({ tool: 'base64', action: 'enc', input: "it's" }))
      .toBe(`tols base64 enc 'it'\\''s'`)
  })

  it('falls back to the @file form for multiline input', () => {
    expect(buildCommand({ tool: 'json', action: 'fmt', input: '{\n"a":1\n}', inputName: 'input.json' }))
      .toBe('tols json fmt @input.json')
  })

  it('falls back to the @file form for input longer than the inline limit', () => {
    const long = 'x'.repeat(INLINE_LIMIT + 1)
    expect(buildCommand({ tool: 'yaml', action: 'fmt', input: long, inputName: 'input.yaml' }))
      .toBe('tols yaml fmt @input.yaml')
  })

  it('uses a generic input name when none is given', () => {
    expect(buildCommand({ tool: 'json', action: 'fmt', input: 'a\nb' }))
      .toBe('tols json fmt @input.txt')
  })

  it('renders value flags as --key=value and boolean flags bare', () => {
    expect(buildCommand({ tool: 'json', action: 'fmt', input: '{}', flags: { indent: 4, json: true } }))
      .toBe(`tols json fmt '{}' --indent=4 --json`)
  })

  it('drops false and nullish flags', () => {
    expect(buildCommand({ tool: 'uuid', action: 'gen', input: '', flags: { json: false, count: null } }))
      .toBe('tols uuid gen')
  })

  it('omits the input segment entirely when input is empty', () => {
    expect(buildCommand({ tool: 'uuid', action: 'gen', input: '', flags: { count: 5 } }))
      .toBe('tols uuid gen --count=5')
  })

  it('quotes flag values that contain spaces', () => {
    expect(buildCommand({ tool: 'jwt', action: 'enc', input: '{}', flags: { secret: 'my secret' } }))
      .toBe(`tols jwt enc '{}' --secret='my secret'`)
  })

  it('keeps input of exactly the inline limit inline', () => {
    const exact = 'x'.repeat(INLINE_LIMIT)
    expect(buildCommand({ tool: 'yaml', action: 'fmt', input: exact }))
      .toBe(`tols yaml fmt ${exact}`)
  })

  it('pipes input that starts with @ so the CLI cannot read it as a file path', () => {
    expect(buildCommand({ tool: 'lorem', action: 'gen', input: '@types/node' }))
      .toBe(`printf '%s' '@types/node' | tols lorem gen`)
  })

  it('pipes input that starts with -- so the CLI cannot read it as a flag', () => {
    expect(buildCommand({ tool: 'base64', action: 'enc', input: '--verbose' }))
      .toBe(`printf '%s' '--verbose' | tols base64 enc`)
  })

  it('places flags after the command in the piped form', () => {
    expect(buildCommand({ tool: 'lorem', action: 'gen', input: '@x', flags: { count: 3 } }))
      .toBe(`printf '%s' '@x' | tols lorem gen --count=3`)
  })

  it('prefers the @file form over piping when the input is also too long', () => {
    const long = '@' + 'x'.repeat(INLINE_LIMIT)
    expect(buildCommand({ tool: 'yaml', action: 'fmt', input: long, inputName: 'input.yaml' }))
      .toBe('tols yaml fmt @input.yaml')
  })

  it('keeps a newline-bearing flag value on one line with ANSI-C quoting', () => {
    expect(buildCommand({ tool: 'jwt', action: 'enc', input: '{}', flags: { secret: 'a\nb' } }))
      .toBe(`tols jwt enc '{}' --secret=$'a\\nb'`)
  })

  it('pipes input that is exactly "--" itself', () => {
    expect(buildCommand({ tool: 'base64', action: 'enc', input: '--' }))
      .toBe(`printf '%s' '--' | tols base64 enc`)
  })
})

describe('templateFor', () => {
  it('covers every tool in the registry', () => {
    const uncovered = tools.map((t) => t.id).filter((id) => !templateFor(id))
    expect(uncovered).toEqual([])
  })

  it('lists the default action among the declared actions', () => {
    for (const t of tools) {
      const tpl = templateFor(t.id)
      expect(tpl.actions, `${t.id} default action not in actions`).toContain(tpl.defaultAction)
    }
  })

  it('maps the json tool onto the tols CLI shape', () => {
    expect(templateFor('json')).toEqual({
      tool: 'json',
      actions: ['fmt', 'min', 'val'],
      defaultAction: 'fmt',
      inputName: 'input.json'
    })
  })
})
