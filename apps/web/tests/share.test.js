import { describe, it, expect, beforeEach } from 'vitest'
import {
  encodeShareState,
  decodeShareState,
  readShareFragment,
  buildShareUrl,
  MAX_ENCODED_LENGTH
} from '$lib/utils/share.js'

describe('share utils', () => {
  beforeEach(() => {
    window.location.hash = ''
  })

  describe('encode/decode roundtrip', () => {
    it('roundtrips plain ASCII state', () => {
      const state = { input: '{"a":1}', mode: 'beautify' }
      const encoded = encodeShareState(state)
      expect(encoded).toBeTruthy()
      expect(decodeShareState(/** @type {string} */ (encoded))).toEqual(state)
    })

    it('roundtrips Unicode and emoji state', () => {
      const state = { input: 'merhaba dünya 🚀 {"键": "值"}' }
      const encoded = encodeShareState(state)
      expect(decodeShareState(/** @type {string} */ (encoded))).toEqual(state)
    })

    it('produces URL-safe output (no +, / or =)', () => {
      const encoded = encodeShareState({ input: '???>>>~~~' })
      expect(encoded).not.toMatch(/[+/=]/)
    })
  })

  describe('decodeShareState', () => {
    it('rejects garbage input', () => {
      expect(decodeShareState('!!!not-base64!!!')).toBeNull()
    })

    it('rejects valid base64 that is not JSON', () => {
      expect(decodeShareState(btoa('hello'))).toBeNull()
    })

    it('rejects arrays and primitives', () => {
      expect(decodeShareState(btoa(JSON.stringify([1, 2])))).toBeNull()
      expect(decodeShareState(btoa(JSON.stringify('x')))).toBeNull()
    })

    it('rejects objects with non-string values', () => {
      expect(decodeShareState(btoa(JSON.stringify({ input: 42 })))).toBeNull()
      expect(decodeShareState(btoa(JSON.stringify({ input: null })))).toBeNull()
    })
  })

  describe('size limit', () => {
    it('refuses to encode beyond the link limit', () => {
      const big = { input: 'a'.repeat(MAX_ENCODED_LENGTH) }
      expect(encodeShareState(big)).toBeNull()
    })

    it('encodes just under the limit', () => {
      const small = { input: 'a'.repeat(1000) }
      expect(encodeShareState(small)).toBeTruthy()
    })
  })

  describe('readShareFragment', () => {
    it('returns null without a share fragment', () => {
      expect(readShareFragment()).toBeNull()
    })

    it('ignores unrelated fragments', () => {
      window.location.hash = '#something-else'
      expect(readShareFragment()).toBeNull()
    })

    it('reads a valid share fragment', () => {
      const encoded = /** @type {string} */ (encodeShareState({ input: 'abc' }))
      window.location.hash = `#s=${encoded}`
      expect(readShareFragment()).toEqual({ input: 'abc' })
    })

    it('returns null for a corrupted share fragment', () => {
      window.location.hash = '#s=%%%%'
      expect(readShareFragment()).toBeNull()
    })
  })

  describe('buildShareUrl', () => {
    it('builds an absolute URL on the current page', () => {
      const url = buildShareUrl('abc')
      expect(url).toBe(`${window.location.origin}${window.location.pathname}#s=abc`)
    })
  })
})
