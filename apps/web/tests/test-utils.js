// Test utilities for DevTools business logic
// Note: `export { ... } from` re-exports do NOT create local bindings,
// so processJwt needs an explicit import of decodeJWT.
import { decodeJWT } from '../src/lib/utils/crypto.js'

export function validateUuidCount(count) {
  if (count < 1 || count > 100) {
    return 'Count must be between 1 and 100'
  }
  return ''
}

export function generateLoremIpsum(paragraphs, wordsPerParagraph, startWithLorem) {
  if (paragraphs < 1) return ''
  
  const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
    'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
    'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat',
    'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non',
    'proident', 'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit',
    'anim', 'id', 'est', 'laborum'
  ]

  const paragraphTexts = []

  for (let p = 0; p < paragraphs; p++) {
    const paragraphWords = []
    const wordCount = wordsPerParagraph || Math.floor(Math.random() * 20) + 10

    for (let i = 0; i < wordCount; i++) {
      const wordIndex = (i + p * wordCount) % loremWords.length
      paragraphWords.push(loremWords[wordIndex])
    }

    const text = paragraphWords.join(' ')
    paragraphTexts.push(startWithLorem ? text.charAt(0).toUpperCase() + text.slice(1) + '.' : text)
  }

  return paragraphTexts.join('\n\n')
}

export function processUrlText(input, mode) {
  if (!input.trim()) {
    return { output: '', error: 'Please enter text' }
  }

  try {
    if (mode === 'encode') {
      return { output: encodeURIComponent(input), error: '' }
    } else {
      return { output: decodeURIComponent(input), error: '' }
    }
  } catch (e) {
    return { output: '', error: 'Invalid input for URL ' + mode }
  }
}

export function extractPathFromUrl(url) {
  try {
    const urlObj = new URL(url)
    const path = urlObj.pathname + urlObj.search + urlObj.hash
    return { output: path, error: '' }
  } catch (e) {
    return { output: '', error: 'Invalid URL' }
  }
}

export function processJson(input, compact) {
  if (!input.trim()) {
    return { output: '', error: 'Please enter JSON input' }
  }

  try {
    const parsed = JSON.parse(input)
    return { output: compact ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2), error: '' }
  } catch (e) {
    const match = e.message.match(/position (\d+)/)
    if (match) {
      const position = parseInt(match[1])
      const line = input.substring(0, position).split('\n').length
      const column = position - input.lastIndexOf('\n', position - 1)
      return { output: '', error: `Invalid JSON at line ${line}, column ${column}: ${e.message}` }
    } else {
      return { output: '', error: `Invalid JSON: ${e.message}` }
    }
  }
}

export function processRegex(input, pattern, flags) {
  if (!pattern.trim()) {
    return { matches: [], error: 'Please enter a regex pattern', highlightedInput: '' }
  }

  if (!input) {
    return { matches: [], error: 'Please enter text to test', highlightedInput: '' }
  }

  try {
    const regex = new RegExp(pattern, flags)

    let matches = []
    if (!regex.global) {
      const match = input.match(regex)
      if (match) {
        matches = [match]
      }
    } else {
      matches = [...input.matchAll(regex)]
    }

    return highlightMatches(input, matches)
  } catch (e) {
    return { matches: [], error: 'Invalid regex: ' + e.message, highlightedInput: '' }
  }
}

function highlightMatches(input, matches) {
  function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  let highlighted = ''
  let lastIndex = 0

  matches.forEach(match => {
    const start = match.index
    const end = start + match[0].length
    highlighted += escapeHtml(input.substring(lastIndex, start))
    highlighted += '<mark>' + escapeHtml(match[0]) + '</mark>'
    lastIndex = end
  })

  highlighted += escapeHtml(input.substring(lastIndex))

  return {
    matches,
    error: '',
    highlightedInput: highlighted
  }
}

export function processBase64(input, mode) {
  if (!input.trim()) {
    return { output: '', error: 'Please enter text' }
  }

  try {
    if (mode === 'encode') {
      return { output: btoa(unescape(encodeURIComponent(input))), error: '' }
    } else {
      const decoded = decodeURIComponent(escape(atob(input)))
      return { output: decoded, error: '' }
    }
  } catch (e) {
    return { output: '', error: 'Invalid input for Base64 ' + mode }
  }
}

export function processTimestamp(input, mode, fromTimezone) {
  if (!input.trim()) {
    return { output: '', error: 'Please enter a timestamp or date' }
  }

  try {
    if (mode === 'toHuman') {
      let timestamp

      if (input.length <= 13 && /^\d+$/.test(input)) {
        timestamp = parseInt(input)
        if (timestamp > 1e12) {
          timestamp = timestamp / 1000
        }
      } else {
        timestamp = new Date(input).getTime() / 1000
      }

      if (isNaN(timestamp)) {
        return { output: '', error: 'Invalid timestamp' }
      }

      const date = new Date(timestamp * 1000)
      return { output: formatDate(date, fromTimezone), error: '' }
    } else {
      const date = new Date(input)
      if (isNaN(date.getTime())) {
        return { output: '', error: 'Invalid date' }
      }
      return { output: Math.floor(date.getTime() / 1000).toString(), error: '' }
    }
  } catch (e) {
    return { output: '', error: 'Conversion failed: ' + e.message }
  }
}

function formatDate(date, tz) {
  if (tz === 'Local') {
    return date.toLocaleString()
  }
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date)
}

export function hexToRgb(hexInput) {
  let clean = hexInput.replace(/[^0-9A-Fa-f]/g, '')
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('')
  }
  if (clean.length !== 6) return null

  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) return null

  return { r, g, b }
}

export function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  }
}

export function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const r = Math.round(255 * f(0))
  const g = Math.round(255 * f(8))
  const b = Math.round(255 * f(4))
  return { r, g, b }
}

export function processColor(hex, rgb, hsl) {
  let rgbObj = null
  let hslObj = null
  let finalHex = ''

  if (hex) {
    rgbObj = hexToRgb(hex)
    if (rgbObj) {
      finalHex = hex.replace(/[^0-9A-Fa-f]/g, '').padStart(6, '0').substring(0, 6)
      hslObj = rgbToHsl(rgbObj.r, rgbObj.g, rgbObj.b)
    }
  } else if (rgb) {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      const r = parseInt(match[1])
      const g = parseInt(match[2])
      const b = parseInt(match[3])
      finalHex = [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
      rgbObj = { r, g, b }
      hslObj = rgbToHsl(r, g, b)
    }
  } else if (hsl) {
    const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (match) {
      const h = parseInt(match[1])
      const s = parseInt(match[2])
      const l = parseInt(match[3])
      if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
        rgbObj = hslToRgb(h, s, l)
        finalHex = [rgbObj.r, rgbObj.g, rgbObj.b].map(v => v.toString(16).padStart(2, '0')).join('')
        hslObj = { h, s, l }
      }
    }
  }

  return {
    hex: finalHex,
    rgb: rgbObj ? `rgb(${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b})` : '',
    hsl: hslObj ? `hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)` : '',
    colorPreview: finalHex ? `#${finalHex}` : '#000000'
  }
}

export async function processJwt(token) {
  if (!token.trim()) {
    return { valid: false, error: 'Please enter a JWT token' }
  }

  const result = await decodeJWT(token)

  if (result.valid) {
    return result
  } else {
    return { valid: false, error: result.error }
  }
}

// Re-export crypto functions for testing
export { generateUUID, generateUUIDs, hashMessage, hashMD5, decodeJWT } from '../src/lib/utils/crypto.js'