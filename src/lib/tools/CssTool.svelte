<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_CSS = `/* Main container styles */
.container, .wrapper, .main {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Title with complex values */
.title {
  font-size: calc(16px + 2vw);
  font-weight: bold;
  color: #333;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>');
}

/* Responsive design */
@media screen and (max-width: 768px) {
  .container {
    flex-direction: column;
    padding: 10px;
  }

  .title {
    font-size: 18px;
  }
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`

  let input = ''
  let output = ''
  let mode = 'beautify'
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-css-input')
      const savedMode = localStorage.getItem('devutils-css-mode')
      if (savedInput) input = savedInput
      else input = EXAMPLE_CSS
      if (savedMode) mode = savedMode
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-css-input', input)
        localStorage.setItem('devutils-css-mode', mode)
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

  function tokenizeCSS(css) {
    const tokens = []
    let i = 0
    const length = css.length

    while (i < length) {
      const char = css[i]

      if (char === '/' && css[i + 1] === '*') {
        let comment = '/*'
        i += 2
        while (i < length - 1 && !(css[i] === '*' && css[i + 1] === '/')) {
          comment += css[i++]
        }
        if (i < length - 1) {
          comment += '*/'
          i += 2
        }
        tokens.push({ type: 'comment', value: comment })
      } else if (char === '"' || char === "'") {
        const quote = char
        let string = quote
        i++
        while (i < length && css[i] !== quote) {
          if (css[i] === '\\' && i + 1 < length) {
            string += css[i++]
          }
          string += css[i++]
        }
        if (i < length) {
          string += quote
          i++
        }
        tokens.push({ type: 'string', value: string })
      } else if (char === '(') {
        let parenCount = 1
        let content = '('
        i++
        while (i < length && parenCount > 0) {
          if (css[i] === '(') {
            parenCount++
            content += css[i++]
          } else if (css[i] === ')') {
            parenCount--
            content += css[i++]
          } else if (css[i] === '"' || css[i] === "'") {
            const quote = css[i]
            content += quote
            i++
            while (i < length && css[i] !== quote) {
              if (css[i] === '\\' && i + 1 < length) {
                content += css[i++]
              }
              content += css[i++]
            }
            if (i < length) {
              content += quote
              i++
            }
          } else {
            content += css[i++]
          }
        }
        tokens.push({ type: 'paren', value: content })
      } else if ('{};:'.includes(char)) {
        tokens.push({ type: 'punctuation', value: char })
        i++
      } else if (char === '@') {
        let atRule = '@'
        i++
        while (i < length && /[^{;]/.test(css[i])) {
          atRule += css[i++]
        }
        tokens.push({ type: 'atrule', value: atRule.trim() })
      } else if (/\s/.test(char)) {
        let whitespace = ''
        while (i < length && /\s/.test(css[i])) {
          whitespace += css[i++]
        }
        tokens.push({ type: 'whitespace', value: whitespace })
      } else {
        let text = ''
        while (i < length && !/[\s{};:"'()]/.test(css[i])) {
          text += css[i++]
        }
        tokens.push({ type: 'text', value: text })
      }
    }

    return tokens
  }

  function formatCSS(css) {
    const tokens = tokenizeCSS(css)
    let result = ''
    let indentLevel = 0
    const indent = '  '
    let blockDepth = 0
    let lastTokenWasNewline = false
    let selectorBuffer = []
    let needsIndent = true

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const prevToken = i > 0 ? tokens[i - 1] : null
      const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null

      if (token.type === 'comment') {
        if (result && !lastTokenWasNewline) {
          result += '\n'
        }
        result += indent.repeat(indentLevel) + token.value + '\n'
        lastTokenWasNewline = true
        continue
      }

      if (token.type === 'whitespace') {
        if (blockDepth > 0 && prevToken && prevToken.type === 'punctuation' && prevToken.value === ';') {
          result += '\n'
          lastTokenWasNewline = true
          needsIndent = true
        }
        continue
      }

      if (token.type === 'punctuation') {
        if (token.value === '{') {
          blockDepth++
          result = result.trimEnd()
          if (selectorBuffer.length > 0) {
            result += ' ' + token.value + '\n'
            selectorBuffer = []
          } else {
            result += ' ' + token.value + '\n'
          }
          indentLevel++
          lastTokenWasNewline = true
          needsIndent = true
        } else if (token.value === '}') {
          if (blockDepth > 0) blockDepth--
          indentLevel = Math.max(0, indentLevel - 1)
          if (!lastTokenWasNewline) {
            result += '\n'
          }
          result += indent.repeat(indentLevel) + token.value + '\n'
          lastTokenWasNewline = true
          needsIndent = true

          if (nextToken && nextToken.type !== 'whitespace' && nextToken.value !== '}') {
            result += '\n'
          }
        } else if (token.value === ';') {
          result += token.value
          if (nextToken && nextToken.type !== 'punctuation' && nextToken.value !== '}') {
            result += '\n'
            lastTokenWasNewline = true
            needsIndent = true
          }
        } else if (token.value === ':') {
          result += ': '
        }
        continue
      }

      if (token.type === 'text' || token.type === 'paren' || token.type === 'string') {
        if (prevToken && prevToken.type === 'atrule') {
          if (!lastTokenWasNewline) {
            result += '\n'
            lastTokenWasNewline = true
          }
          result += indent.repeat(indentLevel) + prevToken.value + ' ' + token.value
          selectorBuffer = []
        } else if (blockDepth > 0) {
          if (needsIndent || lastTokenWasNewline) {
            result += indent.repeat(indentLevel)
            needsIndent = false
          }
          result += token.value
          lastTokenWasNewline = false
        } else {
          if (selectorBuffer.length === 0 && !lastTokenWasNewline && result.length > 0) {
            result += '\n'
            lastTokenWasNewline = true
          }
          if (selectorBuffer.length > 0) {
            result += ',\n' + indent.repeat(indentLevel)
          } else if (lastTokenWasNewline || needsIndent) {
            result += indent.repeat(indentLevel)
            needsIndent = false
          }
          result += token.value
          selectorBuffer.push(token.value)
          lastTokenWasNewline = false
        }
        continue
      }

      if (token.type === 'atrule') {
        if (!lastTokenWasNewline && result.length > 0) {
          result += '\n'
        }
        result += indent.repeat(indentLevel) + token.value
        lastTokenWasNewline = false
        selectorBuffer = []
      }
    }

    return result.trim()
  }

  function minifyCSS(css) {
    const tokens = tokenizeCSS(css)
    let result = ''
    let blockDepth = 0

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const prevToken = i > 0 ? tokens[i - 1] : null
      const nextToken = i < tokens.length - 1 ? tokens[i + 1] : null

      if (token.type === 'comment') {
        continue
      }

      if (token.type === 'whitespace') {
        if (!result) continue
        const prevVal = prevToken?.value || ''
        const nextVal = nextToken?.value || ''
        if (prevToken && (prevVal === '{' || prevVal === ';' || prevVal === ',' || prevVal === ':')) {
          continue
        }
        if (nextToken && (nextVal === '}' || nextVal === '{' || nextVal === ';' || nextVal === ',' || nextVal === ':')) {
          continue
        }
        if (prevToken?.type === 'whitespace') continue
        result += ' '
        continue
      }

      if (token.type === 'punctuation') {
        if (token.value === '{' ) {
          blockDepth++
          result = result.trimEnd()
          result += token.value
        } else if (token.value === '}') {
          if (blockDepth > 0) blockDepth--
          if (prevToken?.value === ';') {
            result = result.slice(0, -1)
          }
          result += token.value
        } else if (token.value === ';') {
          if (nextToken?.value !== '}') {
            result += token.value
          }
        } else if (token.value === ':') {
          result = result.trimEnd()
          result += ':'
        } else if (token.value === ',') {
          result = result.trimEnd()
          result += ','
        }
        continue
      }

      if (token.type === 'text' || token.type === 'paren' || token.type === 'string' || token.type === 'atrule') {
        if (token.type === 'atrule' && result) {
          result += ' '
        }
        result += token.value
      }
    }

    return result
  }

  function process() {
    output = ''

    if (!input.trim()) {
      return
    }

    try {
      if (mode === 'beautify') {
        output = formatCSS(input)
      } else {
        output = minifyCSS(input)
      }
    } catch (e) {
      output = input
    }
  }

  function debouncedProcess() {
    clearTimeout(timeout)
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
    try {
      localStorage.removeItem('devutils-css-input')
      localStorage.removeItem('devutils-css-mode')
    } catch (e) {}
  }

  function loadExample() {
    input = EXAMPLE_CSS
    process()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">CSS Formatter</h1>
      <p class="tool-desc">Beautify and minify CSS</p>
    </div>
    <div class="tool-actions">
      <div class="segmented">
        <button class="segment" class:active={mode === 'beautify'} on:click={() => setMode('beautify')}>Beautify</button>
        <button class="segment" class:active={mode === 'minify'} on:click={() => setMode('minify')}>Minify</button>
      </div>
      <button class="icon-btn" on:click={loadExample} title="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="workspace">
    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">CSS Input</span>
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea bind:value={input} on:input={debouncedProcess} placeholder="Paste CSS here..." class="editor-textarea" spellcheck="false"></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">CSS Output</span>
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
  .tool { display: flex; flex-direction: column; gap: var(--space-5); width: 100%; animation: fadeIn var(--transition) var(--ease-out); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .tool-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
  .tool-meta { display: flex; flex-direction: column; gap: var(--space-1); }
  .tool-name { font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--text-primary); letter-spacing: var(--tracking-tight); margin: 0; }
  .tool-desc { font-size: var(--text-sm); color: var(--text-tertiary); margin: 0; }
  .tool-actions { display: flex; align-items: center; gap: var(--space-2); }
  .segmented { display: flex; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius); padding: 2px; }
  .segment { display: flex; align-items: center; padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: transparent; border: none; cursor: pointer; transition: all var(--transition-fast); }
  .segment:hover { color: var(--text-primary); }
  .segment.active { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-default); box-shadow: var(--shadow-xs); }
  .icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius); background: transparent; color: var(--text-tertiary); border: none; cursor: pointer; transition: all var(--transition-fast); }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .workspace { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
  .editor { display: flex; flex-direction: column; background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; min-height: 400px; }
  .editor-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); }
  .editor-label { font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .editor-meta { display: flex; align-items: center; gap: var(--space-2); }
  .char-count { font-size: var(--text-xs); color: var(--text-muted); font-family: var(--font-mono); }
  .editor-textarea { flex: 1; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); resize: none; outline: none; }
  .editor-textarea::placeholder { color: var(--text-muted); }
  .output-display { flex: 1; margin: 0; padding: var(--space-3); background: var(--bg-surface); color: var(--text-secondary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); white-space: pre-wrap; word-wrap: break-word; overflow: auto; }
  .output-display:not(:empty):not(:only-child) { color: var(--text-primary); }
  @media (max-width: 768px) { .workspace { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
