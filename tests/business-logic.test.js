import { describe, it, expect } from 'vitest'
import {
  validateUuidCount,
  generateLoremIpsum,
  processUrlText,
  extractPathFromUrl,
  processJson,
  processRegex,
  processBase64,
  processTimestamp,
  processColor,
  generateUUID,
  generateUUIDs,
  hashMessage,
  hashMD5,
  decodeJWT
} from './test-utils.js'

// Import processJwt from source instead of duplicating
import { processJwt } from './test-utils.js'

describe('Business Logic Tests', () => {
  describe('UUID Logic', () => {
    it('should validate UUID count correctly', () => {
      expect(validateUuidCount(0)).toBe('Count must be between 1 and 100')
      expect(validateUuidCount(101)).toBe('Count must be between 1 and 100')
      expect(validateUuidCount(1)).toBe('')
      expect(validateUuidCount(50)).toBe('')
      expect(validateUuidCount(100)).toBe('')
    })

    it('should generate valid UUIDs', () => {
      const uuid = generateUUID()
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })

    it('should generate multiple UUIDs', () => {
      const uuids = generateUUIDs(5)
      expect(uuids).toHaveLength(5)
      uuids.forEach(uuid => {
        expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
      })
    })
  })

  describe('Lorem Ipsum Logic', () => {
    it('should generate lorem ipsum text', () => {
      const result = generateLoremIpsum(2, 10, true)
      expect(result).toBeTruthy()
      expect(result.split('\n\n')).toHaveLength(2)
    })

    it('should handle zero paragraphs', () => {
      const result = generateLoremIpsum(0, 10, true)
      expect(result).toBe('')
    })

    it('should respect startWithLorem flag', () => {
      const withLorem = generateLoremIpsum(1, 5, true)
      const withoutLorem = generateLoremIpsum(1, 5, false)

      expect(withLorem.charAt(0)).toBe('L')
      expect(withoutLorem.charAt(0)).toBe('l')
    })
  })

  describe('URL Processing Logic', () => {
    it('should encode text correctly', () => {
      const result = processUrlText('hello world', 'encode')
      expect(result.output).toBe('hello%20world')
      expect(result.error).toBe('')
    })

    it('should decode URL-encoded text', () => {
      const result = processUrlText('hello%20world', 'decode')
      expect(result.output).toBe('hello world')
      expect(result.error).toBe('')
    })

    it('should show error for empty input', () => {
      const result = processUrlText('', 'encode')
      expect(result.output).toBe('')
      expect(result.error).toBe('Please enter text')
    })

    it('should show error for invalid URL decode', () => {
      const result = processUrlText('%invalid', 'decode')
      expect(result.output).toBe('')
      expect(result.error).toBe('Invalid input for URL decode')
    })

    it('should extract path from URL', () => {
      const result = extractPathFromUrl('https://example.com/path/to/page?param=value#section')
      expect(result.output).toBe('/path/to/page?param=value#section')
      expect(result.error).toBe('')
    })

    it('should show error for invalid URL', () => {
      const result = extractPathFromUrl('not-a-url')
      expect(result.output).toBe('')
      expect(result.error).toBe('Invalid URL')
    })
  })

  describe('JSON Processing Logic', () => {
    it('should validate and format JSON', () => {
      const result = processJson('{"name": "test", "value": 123}', false)
      expect(result.output).toBe('{\n  "name": "test",\n  "value": 123\n}')
      expect(result.error).toBe('')
    })

    it('should minify JSON', () => {
      const result = processJson('{"name": "test", "value": 123}', true)
      expect(result.output).toBe('{"name":"test","value":123}')
      expect(result.error).toBe('')
    })

    it('should show error for invalid JSON', () => {
      const result = processJson('{"name": "test", "value":', false)
      expect(result.output).toBe('')
      expect(result.error).toContain('Invalid JSON')
    })

    it('should show error for empty input', () => {
      const result = processJson('', false)
      expect(result.output).toBe('')
      expect(result.error).toBe('Please enter JSON input')
    })
  })

  describe('Regex Processing Logic', () => {
    it('should find matches in text', () => {
      const result = processRegex('test test test', 'test', 'g')
      expect(result.matches.length).toBe(3)
      expect(result.error).toBe('')
    })

    it('should highlight matches', () => {
      const result = processRegex('hello world', 'hello', '')
      expect(result.highlightedInput).toContain('<mark>hello</mark>')
      expect(result.error).toBe('')
    })

    it('should handle invalid regex', () => {
      const result = processRegex('test text', '[invalid', '')
      expect(result.matches.length).toBe(0)
      expect(result.error).toContain('Invalid regex')
    })

    it('should show error for empty pattern', () => {
      const result = processRegex('test text', '', '')
      expect(result.matches.length).toBe(0)
      expect(result.error).toBe('Please enter a regex pattern')
    })
  })

  describe('Base64 Processing Logic', () => {
    it('should encode text to Base64', () => {
      const result = processBase64('hello world', 'encode')
      expect(result.output).toBe('aGVsbG8gd29ybGQ=')
      expect(result.error).toBe('')
    })

    it('should decode Base64 text', () => {
      const result = processBase64('aGVsbG8gd29ybGQ=', 'decode')
      expect(result.output).toBe('hello world')
      expect(result.error).toBe('')
    })

    it('should show error for invalid Base64', () => {
      const result = processBase64('invalid-base64!', 'decode')
      expect(result.output).toBe('')
      expect(result.error).toBe('Invalid input for Base64 decode')
    })
  })

  describe('Timestamp Processing Logic', () => {
    it('should convert Unix timestamp to human readable', () => {
      const result = processTimestamp('1609459200', 'toHuman', 'UTC')
      expect(result.output).toContain('2021')
      expect(result.error).toBe('')
    })

    it('should convert human readable to Unix timestamp', () => {
      const result = processTimestamp('2024-01-15 14:30:00', 'toUnix', '')
      expect(result.output).toBe('1705318200')
      expect(result.error).toBe('')
    })

    it('should show error for invalid timestamp', () => {
      const result = processTimestamp('not-a-timestamp', 'toHuman', 'UTC')
      expect(result.output).toBe('')
      expect(result.error).toBe('Invalid timestamp')
    })

    it('should show error for invalid date', () => {
      const result = processTimestamp('invalid-date', 'toUnix', '')
      expect(result.output).toBe('')
      expect(result.error).toBe('Invalid date')
    })
  })

  describe('Color Processing Logic', () => {
    it('should convert HEX to RGB and HSL', () => {
      const result = processColor('#ff0000', '', '')
      expect(result.rgb).toBe('rgb(255, 0, 0)')
      expect(result.hsl).toBe('hsl(0, 100%, 50%)')
      expect(result.colorPreview).toBe('#ff0000')
    })

    it('should convert RGB to HEX and HSL', () => {
      const result = processColor('', 'rgb(255, 0, 0)', '')
      expect(result.hex).toBe('ff0000')
      expect(result.hsl).toBe('hsl(0, 100%, 50%)')
      expect(result.colorPreview).toBe('#ff0000')
    })

    it('should convert HSL to HEX and RGB', () => {
      const result = processColor('', '', 'hsl(120, 100%, 50%)')
      expect(result.hex).toBe('00ff00')
      expect(result.rgb).toBe('rgb(0, 255, 0)')
      expect(result.colorPreview).toBe('#00ff00')
    })

    it('should handle invalid color inputs', () => {
      const result = processColor('#xyz', 'rgb(300, 0, 0)', 'hsl(400, 100%, 50%)')
      expect(result.hex).toBe('')
      expect(result.rgb).toBe('')
      expect(result.hsl).toBe('')
      expect(result.colorPreview).toBe('#000000')
    })
  })

  describe('Hash Processing Logic', () => {
    it('should hash with SHA-256', async () => {
      const hash = await hashMessage('hello world', 'SHA-256')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should hash with SHA-1', async () => {
      const hash = await hashMessage('hello world', 'SHA-1')
      expect(hash).toMatch(/^[a-f0-9]{40}$/)
    })

    it('should hash with MD5', async () => {
      const hash = await hashMD5('hello world')
      expect(hash).toMatch(/^[a-f0-9]{32}$/)
    })

    it('should produce consistent hashes', async () => {
      const hash1 = await hashMessage('test', 'SHA-256')
      const hash2 = await hashMessage('test', 'SHA-256')
      expect(hash1).toBe(hash2)
    })
  })

  describe('JWT Processing Logic', () => {
    it('should decode valid JWT', async () => {
      const header = { alg: 'HS256', typ: 'JWT' }
      const payload = { sub: '1234567890', name: 'John Doe' }
      const encodedHeader = btoa(JSON.stringify(header))
      const encodedPayload = btoa(JSON.stringify(payload))
      const token = `${encodedHeader}.${encodedPayload}.signature`

      const result = await processJwt(token)
      expect(result.valid).toBe(true)
      expect(result.header).toEqual(header)
      expect(result.payload).toEqual(payload)
    })

    it('should show error for invalid JWT format', async () => {
      const result = await processJwt('invalid.token')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid JWT format: expected 3 parts separated by dots')
    })

    it('should show error for malformed JWT encoding', async () => {
      const result = await processJwt('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid_payload.signature')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid JWT header: unable to decode Base64 or parse JSON')
    })
  })
})
