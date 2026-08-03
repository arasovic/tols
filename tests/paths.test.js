import { describe, it, expect } from 'vitest'
import { resolveAbsoluteBase, stripBase } from '$lib/utils/paths.js'

describe('resolveAbsoluteBase', () => {
  it('returns an absolute base unchanged', () => {
    expect(resolveAbsoluteBase('/dev-utilities', '/dev-utilities/json')).toBe('/dev-utilities')
  })

  it('resolves a relative base against the page pathname', () => {
    expect(resolveAbsoluteBase('.', '/dev-utilities/json')).toBe('/dev-utilities')
  })

  it('resolves a deeper relative base against the page pathname', () => {
    expect(resolveAbsoluteBase('..', '/dev-utilities/foo/bar')).toBe('/dev-utilities')
  })

  it('returns an empty string for an empty base', () => {
    expect(resolveAbsoluteBase('', '/json')).toBe('')
  })
})

describe('stripBase', () => {
  it('strips an absolute base from the pathname', () => {
    expect(stripBase('/dev-utilities', '/dev-utilities/json')).toBe('/json')
  })

  it('strips a relative base (prerender) from the pathname', () => {
    expect(stripBase('.', '/dev-utilities/json')).toBe('/json')
  })

  it('strips a deeper relative base from the pathname', () => {
    expect(stripBase('..', '/dev-utilities/foo/bar')).toBe('/foo/bar')
  })

  it('leaves the pathname untouched for an empty base', () => {
    expect(stripBase('', '/json')).toBe('/json')
  })

  it('strips the base from the home path with a trailing slash', () => {
    expect(stripBase('/dev-utilities', '/dev-utilities/')).toBe('/')
    expect(stripBase('.', '/dev-utilities/')).toBe('/')
  })

  it('falls back to the full pathname when the base does not match', () => {
    expect(stripBase('/dev-utilities', '/json')).toBe('/json')
  })
})