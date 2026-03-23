<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

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

  let input = ''
  let output = ''
  let error = ''
  let mode = 'yaml-to-json'
  let timeout = null
  let saveTimeout = null

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
      error = 'Failed to load from localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-yaml-input', input)
        localStorage.setItem('devutils-yaml-mode', mode)
      }, 500)
    } catch (e) {
      error = 'Failed to save to localStorage: ' + (e.message || 'Unknown error')
    }
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

  // Simple YAML parser
  function parseYAML(yaml) {
    const lines = yaml.split('\n')
    const result = {}
    const stack = [{ obj: result, indent: -1 }]
    let currentArray = null
    let currentArrayIndent = -1
    let inMultiline = false
    let multilineKey = ''
    let multilineValue = ''

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (inMultiline) {
        if (line.trim() === '' || line.length - line.trimStart().length > multilineValue.length) {
          multilineValue += '\n' + line
          continue
        } else {
          const current = stack[stack.length - 1].obj
          current[multilineKey] = multilineValue.trim()
          inMultiline = false
        }
      }
      
      if (!line.trim() || line.trim().startsWith('#')) continue

      const indent = line.length - line.trimStart().length
      const trimmed = line.trim()

      // Handle multiline values (| or >)
      if (trimmed.includes(': |') || trimmed.includes(': >')) {
        const colonIndex = trimmed.indexOf(':')
        multilineKey = trimmed.slice(0, colonIndex).trim()
        multilineValue = ''
        inMultiline = true
        continue
      }

      if (trimmed.startsWith('- ')) {
        const value = trimmed.slice(2).trim()
        if (!currentArray || indent !== currentArrayIndent) {
          currentArrayIndent = indent
          currentArray = []
        }

        if (value.includes(':')) {
          const obj = {}
          const colonIndex = value.indexOf(':')
          const key = value.slice(0, colonIndex).trim()
          const val = value.slice(colonIndex + 1).trim()
          obj[key] = parseValue(val)
          currentArray.push(obj)
        } else if (value) {
          currentArray.push(parseValue(value))
        }

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop()
        }
        const parent = stack[stack.length - 1].obj
        const lastKey = Object.keys(parent).pop()
        if (lastKey) {
          parent[lastKey] = currentArray
        }
      } else if (trimmed.includes(':')) {
        currentArray = null
        const colonIndex = trimmed.indexOf(':')
        const key = trimmed.slice(0, colonIndex).trim()
        let value = trimmed.slice(colonIndex + 1).trim()

        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop()
        }

        const current = stack[stack.length - 1].obj

        if (value === '') {
          current[key] = {}
          stack.push({ obj: current[key], indent })
        } else if (value.startsWith('[') && value.endsWith(']')) {
          current[key] = parseArray(value)
        } else if (value.startsWith('{') && value.endsWith('}')) {
          current[key] = parseInlineObject(value)
        } else {
          current[key] = parseValue(value)
        }
      }
    }

    return result
  }

  function parseValue(value) {
    if (!value) return ''
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null' || value === '~') return null
    if (/^-?\d+$/.test(value)) return parseInt(value, 10)
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value)
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
    const pairs = content.split(',').map(s => s.trim())
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
        } else if (value.includes(':') || value.includes('#') || value.startsWith(' ') || value.endsWith(' ')) {
          result += `${spaces}${key}: "${value.replace(/"/g, '\\"')}"\n`
        } else {
          result += `${spaces}${key}: ${value}\n`
        }
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          result += `${spaces}${key}: []\n`
        } else if (typeof value[0] === 'object' && value[0] !== null) {
          result += `${spaces}${key}:\n`
          for (const item of value) {
            if (typeof item === 'object' && item !== null) {
              result += `${spaces}- ${stringifyYAML(item, indent + 1).trim()}\n`
            } else {
              result += `${spaces}- ${item}\n`
            }
          }
        } else {
          result += `${spaces}${key}:\n`
          for (const item of value) {
            result += `${spaces}- ${item}\n`
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
      error = 'Please enter input'
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
      error = 'Error: ' + (e.message || 'Invalid format')
    }
  }

  function debouncedProcess() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, 300)
  }

  function setMode(newMode) {
    mode = newMode
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
      error = 'Failed to clear localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function loadExample() {
    if (mode === 'yaml-to-json' || mode === 'minify') {
      input = EXAMPLE_YAML
    } else {
      input = JSON.stringify(EXAMPLE_JSON, null, 2)
    }
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
      <div class="segmented">
        <button class="segment" class:active={mode === 'yaml-to-json'} on:click={() => setMode('yaml-to-json')}>
          YAML → JSON
        </button>
        <button class="segment" class:active={mode === 'json-to-yaml'} on:click={() => setMode('json-to-yaml')}>
          JSON → YAML
        </button>
        <button class="segment" class:active={mode === 'minify'} on:click={() => setMode('minify')}>
          Minify
        </button>
      </div>
      <button class="icon-btn" on:click={loadExample} title="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>

  {#if error}
    <div class="error-display">
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
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea 
        bind:value={input} 
        on:input={debouncedProcess} 
        placeholder={mode === 'json-to-yaml' ? 'Enter JSON...' : 'Enter YAML...'} 
        class="editor-textarea" 
        spellcheck="false"
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">{mode === 'json-to-yaml' ? 'YAML Output' : 'JSON Output'}</span>
        <div class="editor-meta">
          {#if output}
            <span class="char-count">{output.length} chars</span>
            <CopyButton text={output} />
          {/if}
        </div>
      </div>
      <pre class="output-display">{output || 'Output will appear here...'}</pre>
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
