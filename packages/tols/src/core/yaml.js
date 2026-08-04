/**
 * YAML core — parser/serializer ported verbatim from apps/web YamlTool.svelte.
 */

// Get indentation level (number of spaces)
/**
 * @param {string} line
 */
function getIndent(line) {
  return line.length - line.trimStart().length
}

/**
 * @typedef {{ obj: any, indent: number, key: string | null, isArray: boolean }} YamlStackItem
 */

// Parse YAML with improved array handling
/**
 * @param {string} yaml
 * @returns {Record<string, unknown>}
 */
export function parse(yaml) {
  if (!yaml.trim()) return {}

  const lines = yaml.split('\n')
  /** @type {Record<string, unknown>} */
  const result = {}

  // Stack of { obj: object, indent: number, key: string, isArray: boolean }
  /** @type {YamlStackItem[]} */
  const stack = [{ obj: result, indent: -1, key: null, isArray: false }]

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const lineNum = i + 1

    // Skip empty lines and comments (but preserve indentation context)
    if (!line.trim() || line.trim().startsWith('#')) {
      i++
      continue
    }

    const indent = getIndent(line)
    const trimmed = line.trim()

    // Handle anchor/alias - skip with error
    if (trimmed.startsWith('&') || trimmed.startsWith('*')) {
      throw new Error(`Line ${lineNum}: Anchor/alias references are not supported`)
    }
    if (trimmed.startsWith('!')) {
      throw new Error(`Line ${lineNum}: Custom tags are not supported`)
    }

    // Pop stack to find correct parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    const current = stack[stack.length - 1]

    // Handle array items
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim()

      // Ensure parent is an array
      if (!current.isArray) {
        // Convert parent from object to array if needed
        if (!Array.isArray(current.obj)) {
          // This shouldn't happen with proper stack management
          throw new Error(`Line ${lineNum}: Array item outside of array context`)
        }
      }

      // Parse the array item value
      if (value.includes(':')) {
        // Object in array: - key: value with possible nested properties
        const colonIndex = value.indexOf(':')
        const key = value.slice(0, colonIndex).trim()
        const val = value.slice(colonIndex + 1).trim()
        const parsedObj = /** @type {Record<string, unknown>} */ ({ [key]: parseValue(val) })
        current.obj.push(parsedObj)

        // Check if next lines are nested properties of this object
        const itemBaseIndent = indent
        let j = i + 1
        while (j < lines.length) {
          const nextLine = lines[j]
          const nextTrimmed = nextLine.trim()

          // Skip empty lines and comments
          if (!nextTrimmed || nextTrimmed.startsWith('#')) {
            j++
            continue
          }

          const nextIndent = getIndent(nextLine)

          // Stop if we encounter a new array item at same or lower indent
          if (nextTrimmed.startsWith('- ') && nextIndent <= itemBaseIndent) {
            break
          }

          // Stop if indent is same or lower than base (end of this object)
          if (nextIndent <= itemBaseIndent) {
            break
          }

          // Process nested key-value pairs
          if (nextTrimmed.includes(':')) {
            const nestedColonIndex = nextTrimmed.indexOf(':')
            const nestedKey = nextTrimmed.slice(0, nestedColonIndex).trim()
            let nestedVal = nextTrimmed.slice(nestedColonIndex + 1).trim()

            // Check for nested object or array
            const nextNextLine = j + 1 < lines.length ? lines[j + 1] : null
            const nextNextIndent = nextNextLine ? getIndent(nextNextLine) : -1
            const nextNextTrimmed = nextNextLine ? nextNextLine.trim() : ''

            if (nestedVal === '' && nextNextTrimmed && !nextNextTrimmed.startsWith('#')) {
              if (nextNextTrimmed.startsWith('- ') && nextNextIndent > nextIndent) {
                // Nested array
                /** @type {unknown[]} */
                const arr = []
                parsedObj[nestedKey] = arr
                stack.push({ obj: arr, indent: nextIndent, key: nestedKey, isArray: true })
                i = j
                break
              } else if (nextNextIndent > nextIndent) {
                // Nested object
                /** @type {Record<string, unknown>} */
                const obj = {}
                parsedObj[nestedKey] = obj
                stack.push({ obj, indent: nextIndent, key: nestedKey, isArray: false })
                i = j
                break
              } else {
                parsedObj[nestedKey] = {}
              }
            } else if (nestedVal.startsWith('[') && nestedVal.endsWith(']')) {
              parsedObj[nestedKey] = parseArray(nestedVal)
            } else if (nestedVal.startsWith('{') && nestedVal.endsWith('}')) {
              parsedObj[nestedKey] = parseInlineObject(nestedVal)
            } else {
              parsedObj[nestedKey] = parseValue(nestedVal)
            }
          }

          j++
        }

        // Skip consumed lines
        i = j - 1
      } else if (value.startsWith('{') && value.endsWith('}')) {
        // Inline object in array
        current.obj.push(parseInlineObject(value))
      } else {
        // Simple value in array
        current.obj.push(parseValue(value))
      }
    }
    // Handle key-value pairs
    else if (trimmed.includes(':')) {
      const colonIndex = trimmed.indexOf(':')
      const key = trimmed.slice(0, colonIndex).trim()
      let value = trimmed.slice(colonIndex + 1).trim()

      // Validate key - should not be empty or contain only special characters
      if (!key || key.includes(':')) {
        throw new Error(`Line ${lineNum}: Invalid key "${key}"`)
      }

      // Check next line indentation to determine if it's a nested structure
      const nextLine = i + 1 < lines.length ? lines[i + 1] : null
      const nextIndent = nextLine ? getIndent(nextLine) : -1
      const nextTrimmed = nextLine ? nextLine.trim() : ''

      if (value === '' && nextTrimmed && !nextTrimmed.startsWith('#')) {
        // Empty value means nested object or array
        if (nextTrimmed.startsWith('- ')) {
          // This is an array
          /** @type {unknown[]} */
          const arr = []
          current.obj[key] = arr
          stack.push({ obj: arr, indent, key, isArray: true })
        } else if (nextIndent > indent) {
          // This is a nested object
          /** @type {Record<string, unknown>} */
          const obj = {}
          current.obj[key] = obj
          stack.push({ obj, indent, key, isArray: false })
        } else {
          current.obj[key] = {}
        }
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array
        current.obj[key] = parseArray(value)
      } else if (value.startsWith('{') && value.endsWith('}')) {
        // Inline object
        current.obj[key] = parseInlineObject(value)
      } else if (value === '|' || value === '>') {
        // Multiline string
        i++
        const contentLines = []
        const baseIndent = nextIndent
        while (i < lines.length) {
          const contentLine = lines[i]
          const contentIndent = getIndent(contentLine)
          if (contentLine.trim() === '' || contentIndent >= baseIndent) {
            contentLines.push(contentLine.slice(baseIndent))
            i++
          } else {
            break
          }
        }
        i-- // Back up one line since the outer loop will increment
        current.obj[key] = contentLines.join('\n')
      } else {
        // Simple value
        current.obj[key] = parseValue(value)
      }
    }

    i++
  }

  return result
}

// Parse a line with key: value format
/**
 * @param {string} line
 * @param {number} lineNum
 */
function parseLine(line, lineNum) {
  const colonIndex = line.indexOf(':')
  if (colonIndex === -1) {
    throw new Error(`Line ${lineNum}: Invalid format, expected key: value`)
  }
  const key = line.slice(0, colonIndex).trim()
  const value = line.slice(colonIndex + 1).trim()
  return { [key]: parseValue(value) }
}

/**
 * @param {string} value
 * @returns {string | number | boolean | null}
 */
function parseValue(value) {
  if (!value) return ''
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null' || value === '~') return null
  if (/^-?\d+$/.test(value)) return parseInt(value, 10)
  if (/^-?\d+\.?\d*(?:[eE][+-]?\d+)?$/.test(value)) return parseFloat(value)
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

/**
 * @param {string} str
 * @returns {unknown[]}
 */
function parseArray(str) {
  const content = str.slice(1, -1)
  if (!content.trim()) return []
  return content.split(',').map(/** @param {string} v */ v => parseValue(v.trim()))
}

/**
 * @param {string} str
 * @returns {Record<string, unknown>}
 */
function parseInlineObject(str) {
  const content = str.slice(1, -1)
  if (!content.trim()) return {}
  /** @type {Record<string, unknown>} */
  const result = {}
  const pairs = splitInlinePairs(content)
  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':')
    if (colonIndex > 0) {
      const key = pair.slice(0, colonIndex).trim()
      const value = pair.slice(colonIndex + 1).trim()
      result[key] = parseValue(value)
    }
  }
  return result
}

/**
 * @param {string} content
 * @returns {string[]}
 */
function splitInlinePairs(content) {
  const pairs = []
  let depth = 0
  let current = ''
  for (const char of content) {
    if (char === '{' || char === '[') {
      depth++
      current += char
    } else if (char === '}' || char === ']') {
      depth--
      current += char
    } else if (char === ',' && depth === 0) {
      pairs.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) {
    pairs.push(current.trim())
  }
  return pairs
}

/**
 * @param {string} str
 */
function needsQuoting(str) {
  if (!str) return false
  if (str.length === 0) return true
  const specialChars = /[:#{}[\],&*!?'|>%@`]/
  if (specialChars.test(str)) return true
  if (str.startsWith(' ') || str.endsWith(' ')) return true
  if (str.startsWith('- ') || str === '-') return true
  if (['true', 'false', 'null', 'yes', 'no', 'on', 'off'].includes(str.toLowerCase())) {
    return true
  }
  return false
}

/**
 * @param {object} obj
 * @param {number} indent
 */
export function stringify(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  let result = ''

  for (const [key, value] of Object.entries(obj)) {
    if (value === null) {
      result += `${spaces}${key}: null\n`
    } else if (typeof value === 'boolean') {
      result += `${spaces}${key}: ${value}\n`
    } else if (typeof value === 'number') {
      result += `${spaces}${key}: ${value}\n`
    } else if (typeof value === 'string') {
      if (value.includes('\n')) {
        result += `${spaces}${key}: |\n${value.split('\n').map(l => spaces + '  ' + l).join('\n')}\n`
      } else if (needsQuoting(value)) {
        result += `${spaces}${key}: "${value.replace(/"/g, '\\"')}"\n`
      } else {
        result += `${spaces}${key}: ${value}\n`
      }
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        result += `${spaces}${key}: []\n`
      } else {
        result += `${spaces}${key}:\n`
        for (const item of value) {
          if (item === null) {
            result += `${spaces}- null\n`
          } else if (typeof item === 'boolean') {
            result += `${spaces}- ${item}\n`
          } else if (typeof item === 'number') {
            result += `${spaces}- ${item}\n`
          } else if (typeof item === 'string') {
            if (item.includes('\n')) {
              result += `${spaces}- |\n${item.split('\n').map(l => spaces + '  ' + l).join('\n')}\n`
            } else if (needsQuoting(item)) {
              result += `${spaces}- "${item.replace(/"/g, '\\"')}"\n`
            } else {
              result += `${spaces}- ${item}\n`
            }
          } else if (typeof item === 'object') {
            const lines = stringify(item, indent + 1).trim().split('\n')
            if (lines.length > 0) {
              result += `${spaces}- ${lines[0]}\n`
              for (let i = 1; i < lines.length; i++) {
                result += `${lines[i]}\n`
              }
            }
          }
        }
      }
    } else if (typeof value === 'object') {
      result += `${spaces}${key}:\n`
      result += stringify(value, indent + 1)
    }
  }

  return result
}