<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
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

  const MAX_INPUT_SIZE = 1024 * 1024 // 1MB

  let input = ''
  let output = ''
  let error = ''
  let mode = 'beautify'
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-css-input')
      const savedMode = localStorage.getItem('devutils-css-mode')
      if (savedInput) input = savedInput
      else input = EXAMPLE_CSS
      if (savedMode) mode = savedMode
    } catch (/** @type {any} */ e) {}
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-css-input', input)
        localStorage.setItem('devutils-css-mode', mode)
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, 500)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
      if (shared.mode === 'beautify' || shared.mode === 'minify') mode = shared.mode
      process()
    } else {
      loadState()
      if (input) process()
    }
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

  /**
   * @param {string} atRule
   * @returns {'rules' | 'declarations'}
   */
  function atRuleBlockKind(atRule) {
    const name = atRule.split(/[\s(]/)[0]
    const ruleContainers = ['@media', '@supports', '@container', '@layer', '@document', '@keyframes']
    return ruleContainers.includes(name) ? 'rules' : 'declarations'
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
    /** @type {Array<'declarations' | 'rules'>} */
    const blockStack = []

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
        } else if (
          blockDepth > 0 &&
          blockStack[blockStack.length - 1] === 'declarations' &&
          prevToken &&
          (prevToken.type === 'text' || prevToken.type === 'paren' || prevToken.type === 'string') &&
          nextToken &&
          (nextToken.type === 'text' || nextToken.type === 'paren' || nextToken.type === 'string')
        ) {
          // Whitespace inside a declaration value is meaningful: `0 2px 4px`
          // keeps a single space between value tokens. The colon handler
          // already emits the space after `:`, and the whitespace before `;`
          // or `}` is dropped by the value-token guard above.
          result += ' '
          lastTokenWasNewline = false
        } else if (blockDepth === 0 && selectorBuffer.length > 0) {
          // Whitespace inside a selector is meaningful: descendant combinator
          // (`.parent .child`) or spacing after a comma in a selector list.
          result += ' '
        }
        continue
      }

      if (token.type === 'punctuation') {
        if (token.value === '{') {
          blockDepth++
          /** @type {'declarations' | 'rules'} */
          let blockKind = 'declarations'
          for (let j = i - 1; j >= 0; j--) {
            const prev = tokens[j]
            if (prev.type === 'whitespace' || prev.type === 'comment') continue
            if (prev.type === 'atrule') blockKind = atRuleBlockKind(prev.value)
            break
          }
          blockStack.push(blockKind)
          result = result.trimEnd()
          result += ' ' + token.value + '\n'
          selectorBuffer = []
          indentLevel++
          lastTokenWasNewline = true
          needsIndent = true
        } else if (token.value === '}') {
          if (blockDepth > 0) blockDepth--
          if (blockStack.length > 0) blockStack.pop()
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
          // A colon separates property and value only inside a declaration
          // block (`.class { color: blue }`). In a selector (`a:hover`) or
          // inside a rule-container at-rule block (`@media { a:hover { ... } }`)
          // it is a pseudo-class and must not be space-padded.
          const inDeclarationBlock = blockStack.length > 0 && blockStack[blockStack.length - 1] === 'declarations'
          result += inDeclarationBlock ? ': ' : ':'
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
          if (result.trimEnd().endsWith(',')) {
            // Selector list: `h1, h2` → one selector per line
            result = result.trimEnd() + '\n' + indent.repeat(indentLevel)
          } else if (result.endsWith(' ')) {
            // Continuation of the same selector (e.g. `.parent .child`)
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
    error = ''

    if (!input.trim()) {
      return
    }

    if (input.length > MAX_INPUT_SIZE) {
      error = `Input exceeds maximum size of ${MAX_INPUT_SIZE / 1024 / 1024}MB. Large files may cause performance issues.`
      return
    }

    try {
      if (mode === 'beautify') {
        output = formatCSS(input)
      } else {
        output = minifyCSS(input)
      }
    } catch (/** @type {any} */ e) {
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
    } catch (/** @type {any} */ e) {}
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
      <ShareButton getState={() => ({ input, mode })} />
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
      <div class="segmented">
        <button type="button" class="segment" class:active={mode === 'beautify'} on:click={() => setMode('beautify')}>Beautify</button>
        <button type="button" class="segment" class:active={mode === 'minify'} on:click={() => setMode('minify')}>Minify</button>
      </div>
      <button type="button" class="icon-btn" on:click={loadExample} title="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button type="button" class="icon-btn" on:click={clear} title="Clear">
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
      <textarea bind:value={input} on:input={debouncedProcess} use:fileDrop={{ onText: (text) => { input = text; process() } }} placeholder="Paste CSS here..." class="editor-textarea" spellcheck="false"></textarea>
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
      {#if error}
        <div class="error-bar" role="alert">{error}</div>
      {/if}
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
  .error-bar { padding: var(--space-3); margin-bottom: var(--space-2); background: var(--error-soft, rgba(239, 68, 68, 0.1)); border: 1px solid var(--error, #ef4444); border-radius: var(--radius-md); color: var(--error, #ef4444); font-size: var(--text-sm); }
  .output-display:not(:empty):not(:only-child) { color: var(--text-primary); }
  @media (max-width: 768px) { .workspace { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
