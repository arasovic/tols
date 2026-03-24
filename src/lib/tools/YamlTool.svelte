<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  const EXAMPLE_YAML = `name: DevUtils
version: 1.0.0
features:
  - JSON formatter
  - Base64 encoder
  - UUID generator
config:
  debug: true
  timeout: 30`

  const EXAMPLE_JSON = {
    name: "DevUtils",
    version: "1.0.0",
    features: ["JSON formatter", "Base64 encoder", "UUID generator"],
    config: { debug: true, timeout: 30 }
  }

  const DEBOUNCE_MS = 300
  const SAVE_DEBOUNCE_MS = 500
  const MAX_INPUT_SIZE = 1024 * 1024 // 1MB

  let input = ''
  let output = ''
  let error = ''
  let mode = 'yaml-to-json'
  let timeout = null
  let saveTimeout = null
  let mounted = false

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-yaml-input')
      const savedMode = localStorage.getItem('devutils-yaml-mode')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_YAML
      }
      if (savedMode) mode = savedMode
    } catch (e) {
      input = EXAMPLE_YAML
      console.error('Failed to load from localStorage:', e.message || 'Unknown error')
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-yaml-input', input)
        localStorage.setItem('devutils-yaml-mode', mode)
      }, SAVE_DEBOUNCE_MS)
    } catch (e) {
      console.error('Failed to save to localStorage:', e.message || 'Unknown error')
    }
  }

  onMount(() => {
    loadState()
    mounted = true
    // Process immediately since loadState is synchronous
    if (input) process()

    return () => {
      if (timeout) clearTimeout(timeout)
      if (saveTimeout) clearTimeout(saveTimeout)
    }
  })

  onDestroy(() => {
    if (timeout) clearTimeout(timeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })

  // Get indentation level (number of spaces)
  function getIndent(line) {
    return line.length - line.trimStart().length
  }

  // Parse YAML with improved array handling
  function parseYAML(yaml) {
    if (!yaml.trim()) return {}

    const lines = yaml.split('\n')
    const result = {}

    // Stack of { obj: object, indent: number, key: string, isArray: boolean }
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
          const parsedObj = { [key]: parseValue(val) }
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
                  const arr = []
                  parsedObj[nestedKey] = arr
                  stack.push({ obj: arr, indent: nextIndent, key: nestedKey, isArray: true })
                  i = j
                  break
                } else if (nextNextIndent > nextIndent) {
                  // Nested object
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
            const arr = []
            current.obj[key] = arr
            stack.push({ obj: arr, indent, key, isArray: true })
          } else if (nextIndent > indent) {
            // This is a nested object
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
  function parseLine(line, lineNum) {
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) {
      throw new Error(`Line ${lineNum}: Invalid format, expected key: value`)
    }
    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()
    return { [key]: parseValue(value) }
  }

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

  function parseArray(str) {
    const content = str.slice(1, -1)
    if (!content.trim()) return []
    return content.split(',').map(v => parseValue(v.trim()))
  }

  function parseInlineObject(str) {
    const content = str.slice(1, -1)
    if (!content.trim()) return {}
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

  function stringifyYAML(obj, indent = 0) {
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
              const lines = stringifyYAML(item, indent + 1).trim().split('\n')
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
        result += stringifyYAML(value, indent + 1)
      }
    }

    return result
  }

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      return
    }

    if (input.length > MAX_INPUT_SIZE) {
      error = `Input exceeds maximum size of ${MAX_INPUT_SIZE / 1024 / 1024}MB`
      return
    }

    try {
      if (mode === 'yaml-to-json') {
        const parsed = parseYAML(input)
        output = JSON.stringify(parsed, null, 2)
      } else if (mode === 'json-to-yaml') {
        const parsed = JSON.parse(input)
        output = stringifyYAML(parsed).trim()
      } else if (mode === 'minify') {
        const parsed = parseYAML(input)
        output = stringifyYAML(parsed).replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
      }
    } catch (e) {
      error = e.message || 'Invalid format'
    }
  }

  function debouncedProcess() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_MS)
  }

  function setMode(newMode) {
    mode = newMode
    error = ''
    process()
    saveState()
  }

  function clear() {
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-yaml-input')
      localStorage.removeItem('devutils-yaml-mode')
    } catch (e) {
      console.error('Failed to clear localStorage:', e.message || 'Unknown error')
    }
  }

  function loadExample() {
    if (mode === 'yaml-to-json' || mode === 'minify') {
      input = EXAMPLE_YAML
    } else {
      input = JSON.stringify(EXAMPLE_JSON, null, 2)
    }
    error = ''
    process()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">YAML Formatter</h1>
      <p class="tool-desc">Format, validate, and convert YAML to JSON</p>
    </div>
    <div class="tool-actions">
      <div class="segmented" role="tablist" aria-label="Conversion mode">
        <button
          class="segment"
          class:active={mode === 'yaml-to-json'}
          on:click={() => setMode('yaml-to-json')}
          role="tab"
          aria-selected={mode === 'yaml-to-json'}
          aria-label="Convert YAML to JSON"
        >
          YAML → JSON
        </button>
        <button
          class="segment"
          class:active={mode === 'json-to-yaml'}
          on:click={() => setMode('json-to-yaml')}
          role="tab"
          aria-selected={mode === 'json-to-yaml'}
          aria-label="Convert JSON to YAML"
        >
          JSON → YAML
        </button>
        <button
          class="segment"
          class:active={mode === 'minify'}
          on:click={() => setMode('minify')}
          role="tab"
          aria-selected={mode === 'minify'}
          aria-label="Minify YAML"
        >
          Minify
        </button>
      </div>
      <button class="icon-btn" on:click={loadExample} title="Load Example" aria-label="Load example data">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear" aria-label="Clear all content">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>

  {#if error}
    <div class="error-display" role="alert" aria-live="polite">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  <div class="workspace">
    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">{mode === 'json-to-yaml' ? 'JSON Input' : 'YAML Input'}</span>
        <span class="char-count" aria-label="Character count">{input.length} chars</span>
      </div>
      <textarea
        bind:value={input}
        on:input={debouncedProcess}
        placeholder={mode === 'json-to-yaml' ? 'Enter JSON...' : 'Enter YAML...'}
        class="editor-textarea"
        spellcheck="false"
        aria-label={mode === 'json-to-yaml' ? 'JSON input' : 'YAML input'}
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">{mode === 'json-to-yaml' ? 'YAML Output' : 'JSON Output'}</span>
        <div class="editor-meta">
          {#if output}
            <span class="char-count" aria-label="Output character count">{output.length} chars</span>
            <CopyButton text={output} />
          {/if}
        </div>
      </div>
      <pre class="output-display" aria-label="Output" role="region">{output || 'Output will appear here...'}</pre>
    </div>
  </div>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    width: 100%;
    animation: fadeIn var(--transition) var(--ease-out);
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
  }

  .tool-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .tool-name {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: var(--tracking-tight);
    margin: 0;
  }

  .tool-desc {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0;
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .segmented {
    display: flex;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    padding: 2px;
  }

  .segment {
    display: flex;
    align-items: center;
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .segment:hover {
    color: var(--text-primary);
  }

  .segment.active {
    background: var(--bg-surface);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
    box-shadow: var(--shadow-xs);
  }

  .icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-tertiary);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .icon-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .error-display {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    background: var(--error-soft);
    color: var(--error-text);
    border-radius: var(--radius-md);
  }

  .workspace {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .editor {
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    min-height: 400px;
  }

  .editor-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  }

  .editor-label {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--text-tertiary);
  }

  .editor-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .char-count {
    font-size: var(--text-xs);
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .editor-textarea {
    flex: 1;
    padding: var(--space-3);
    border: none;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    resize: none;
    outline: none;
  }

  .editor-textarea::placeholder {
    color: var(--text-muted);
  }

  .output-display {
    flex: 1;
    margin: 0;
    padding: var(--space-3);
    background: var(--bg-surface);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-snug);
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
  }

  .output-display:not(:empty):not(:only-child) {
    color: var(--text-primary);
  }

  @media (max-width: 768px) {
    .workspace {
      grid-template-columns: 1fr;
    }

    .tool-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .tool-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
