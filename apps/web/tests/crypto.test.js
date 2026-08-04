import { describe, it, expect, beforeEach } from 'vitest'
import { generateUUID, generateUUIDs, hashMessage, hashMD5, decodeJWT } from '$lib/utils/crypto.js'

describe('Crypto Utils', () => {
  describe('generateUUID', () => {
    it('should generate a valid UUID', () => {
      const uuid = generateUUID()
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID()
      const uuid2 = generateUUID()
      expect(uuid1).not.toBe(uuid2)
    })
  })

  describe('generateUUIDs', () => {
    it('should generate correct number of UUIDs', () => {
      const uuids = generateUUIDs(5)
      expect(uuids).toHaveLength(5)
      uuids.forEach(uuid => {
        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      })
    })

    it('should return empty array for count 0', () => {
      const uuids = generateUUIDs(0)
      expect(uuids).toHaveLength(0)
    })

    it('should return empty array for negative count', () => {
      const uuids = generateUUIDs(-1)
      expect(uuids).toHaveLength(0)
    })
  })

  describe('hashMessage', () => {
    it('should hash message with SHA-256', async () => {
      const message = 'hello world'
      const hash = await hashMessage(message, 'SHA-256')

      expect(hash).toBeTruthy()
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should hash message with SHA-1', async () => {
      const message = 'hello world'
      const hash = await hashMessage(message, 'SHA-1')

      expect(hash).toBeTruthy()
      expect(hash).toMatch(/^[a-f0-9]{40}$/)
    })

    it('should produce consistent hash for same message', async () => {
      const message = 'test message'
      const hash1 = await hashMessage(message, 'SHA-256')
      const hash2 = await hashMessage(message, 'SHA-256')

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different messages', async () => {
      const message1 = 'hello world'
      const message2 = 'hello universe'
      const hash1 = await hashMessage(message1, 'SHA-256')
      const hash2 = await hashMessage(message2, 'SHA-256')

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', async () => {
      const hash = await hashMessage('', 'SHA-256')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle special characters', async () => {
      const message = 'test@#$%^&*()_+<>?'
      const hash = await hashMessage(message, 'SHA-256')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle Unicode characters', async () => {
      const message = 'こんにちは世界'
      const hash = await hashMessage(message, 'SHA-256')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('hashMD5', () => {
    it('should hash message with MD5', async () => {
      const message = 'hello world'
      const hash = await hashMD5(message)

      expect(hash).toBeTruthy()
      expect(hash).toMatch(/^[a-f0-9]{32}$/)
    })

    it('should produce consistent MD5 hash for same message', async () => {
      const message = 'test message'
      const hash1 = await hashMD5(message)
      const hash2 = await hashMD5(message)

      expect(hash1).toBe(hash2)
    })

    it('should produce different MD5 hashes for different messages', async () => {
      const message1 = 'hello world'
      const message2 = 'hello universe'
      const hash1 = await hashMD5(message1)
      const hash2 = await hashMD5(message2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string with MD5', async () => {
      const hash = await hashMD5('')
      expect(hash).toMatch(/^[a-f0-9]{32}$/)
    })

    it('should match known MD5 hash for "hello world"', async () => {
      const hash = await hashMD5('hello world')
      expect(hash).toBe('5eb63bbbe01eeed093cb22bb8f5acdc3')
    })
  })

  describe('decodeJWT', () => {
    it('should decode valid JWT token', async () => {
      const header = { alg: 'HS256', typ: 'JWT' }
      const payload = { sub: '1234567890', name: 'John Doe', iat: 1516239022 }

      const encodedHeader = btoa(JSON.stringify(header))
      const encodedPayload = btoa(JSON.stringify(payload))
      const token = `${encodedHeader}.${encodedPayload}.signature`

      const result = await decodeJWT(token)

      expect(result.valid).toBe(true)
      expect(result.header).toEqual(header)
      expect(result.payload).toEqual(payload)
    })

    it('should return error for invalid JWT format', async () => {
      const invalidToken = 'invalid.token'
      const result = await decodeJWT(invalidToken)

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid JWT format: expected 3 parts separated by dots')
    })

    it('should return error for malformed JWT encoding', async () => {
      const malformedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_payload.signature'
      const result = await decodeJWT(malformedToken)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('unable to decode')
    })

    it('should handle JWT with empty payload', async () => {
      const header = { alg: 'HS256', typ: 'JWT' }
      const payload = {}

      const encodedHeader = btoa(JSON.stringify(header))
      const encodedPayload = btoa(JSON.stringify(payload))
      const token = `${encodedHeader}.${encodedPayload}.signature`

      const result = await decodeJWT(token)

      expect(result.valid).toBe(true)
      expect(result.header).toEqual(header)
      expect(result.payload).toEqual(payload)
    })

    it('should handle JWT with special characters in payload', async () => {
      const header = { alg: 'HS256', typ: 'JWT' }
      const payload = { message: 'Hello World!', special: '@#$%^&*()' }

      const encodedHeader = btoa(JSON.stringify(header))
      const encodedPayload = btoa(JSON.stringify(payload))
      const token = `${encodedHeader}.${encodedPayload}.signature`

      const result = await decodeJWT(token)

      expect(result.valid).toBe(true)
      expect(result.payload.message).toBe('Hello World!')
      expect(result.payload.special).toBe('@#$%^&*()')
    })
  })
})
