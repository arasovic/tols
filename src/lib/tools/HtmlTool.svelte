<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_HTML = `<!DOCTYPE html>
<html>
<head>
  <title>Example</title>
  <style>
    body { color: #333; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
    <p>This is a paragraph.</p>
    <!-- Comment -->
  </div>
</body>
</html>`

  let input = ''
  let output = ''
  let error = ''
  let mode = 'beautify'
  let removeComments = false
  let removeWhitespace = false
  let timeout = null
  let saveTimeout = null

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-html-input')
      const savedMode = localStorage.getItem('devutils-html-mode')
      if (savedInput) input = savedInput
      else input = EXAMPLE_HTML
      if (savedMode) mode = savedMode
    } catch (e) {
      input = EXAMPLE_HTML
      error = 'Failed to load from localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-html-input', input)
        localStorage.setItem('devutils-html-mode', mode)
      }, 500)
    } catch (e) {
      error = 'Failed to save to localStorage: ' + (e.message || 'Unknown error')
    }
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

  // Void elements that don't need closing tags
  const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
    'param', 'source', 'track', 'wbr'
  ])

  // Elements where whitespace is significant
  const PRESERVE_WHITESPACE = new Set(['pre', 'code', 'textarea', 'script', 'style'])

  function formatHTML(html) {
    let formatted = ''
    let indent = 0
    const tab = '  '
    
    // Tokenize HTML
    const tokens = []
    let i = 0
    
    while (i < html.length) {
      if (html[i] === '<') {
        if (html.substring(i, i + 4) === '<!--') {
          // Comment
          const end = html.indexOf('-->', i)
          if (end === -1) {
            tokens.push({ type: 'comment', content: html.substring(i) })
            break
          }
          tokens.push({ type: 'comment', content: html.substring(i, end + 3) })
          i = end + 3
        } else if (html.substring(i, i + 9).toLowerCase() === '<!doctype') {
          // DOCTYPE
          const end = html.indexOf('>', i)
          if (end === -1) {
            tokens.push({ type: 'doctype', content: html.substring(i) })
            break
          }
          tokens.push({ type: 'doctype', content: html.substring(i, end + 1) })
          i = end + 1
        } else if (html.substring(i, i + 2) === '</') {
          // Closing tag
          const end = html.indexOf('>', i)
          if (end === -1) {
            tokens.push({ type: 'text', content: html.substring(i) })
            break
          }
          const tagName = html.substring(i + 2, end).trim().split(/\s+/)[0].toLowerCase()
          tokens.push({ type: 'close', name: tagName })
          i = end + 1
        } else {
          // Opening or self-closing tag
          const end = html.indexOf('>', i)
          if (end === -1) {
            tokens.push({ type: 'text', content: html.substring(i) })
            break
          }
          const tagContent = html.substring(i + 1, end)
          const isSelfClosing = tagContent.endsWith('/') || VOID_ELEMENTS.has(tagContent.split(/\s+/)[0].toLowerCase())
          const actualContent = isSelfClosing && tagContent.endsWith('/') ? tagContent.slice(0, -1).trim() : tagContent.trim()
          const tagName = actualContent.split(/\s+/)[0].toLowerCase()
          
          tokens.push({ 
            type: isSelfClosing ? 'self-closing' : 'open', 
            name: tagName,
            content: html.substring(i, end + 1)
          })
          i = end + 1
        }
      } else {
        // Text content
        const nextTag = html.indexOf('<', i)
        let text
        if (nextTag === -1) {
          text = html.substring(i)
          i = html.length
        } else {
          text = html.substring(i, nextTag)
          i = nextTag
        }
        if (text) {
          tokens.push({ type: 'text', content: text })
        }
      }
    }
    
    // Format tokens
    const tagStack = []
    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j]
      
      switch (token.type) {
        case 'doctype':
          formatted += token.content + '\n'
          break
        case 'comment':
          formatted += tab.repeat(indent) + token.content + '\n'
          break
        case 'open':
          formatted += tab.repeat(indent) + token.content + '\n'
          tagStack.push(token.name)
          if (!PRESERVE_WHITESPACE.has(token.name)) {
            indent++
          }
          break
        case 'close':
          if (tagStack.length > 0 && tagStack[tagStack.length - 1] === token.name) {
            tagStack.pop()
          }
          if (!PRESERVE_WHITESPACE.has(token.name)) {
            indent = Math.max(0, indent - 1)
          }
          formatted += tab.repeat(indent) + '</' + token.name + '>\n'
          break
        case 'self-closing':
          formatted += tab.repeat(indent) + token.content + '\n'
          break
        case 'text':
          const trimmed = token.content.trim()
          if (trimmed) {
            if (tagStack.length > 0 && PRESERVE_WHITESPACE.has(tagStack[tagStack.length - 1])) {
              formatted += token.content
            } else {
              formatted += tab.repeat(indent) + escapeHtml(trimmed) + '\n'
            }
          }
          break
      }
    }
    
    return formatted.trim() || html
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  function minifyHTML(html) {
    let minified = html
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n/g, ' ')

    if (removeComments) {
      minified = minified.replace(/<!--[\s\S]*?-->/g, '')
    }

    if (removeWhitespace) {
      minified = minified
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
        .replace(/\s*>/g, '>')
        .replace(/<\s*/g, '<')
    }

    return minified.trim()
  }

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      error = 'Please enter HTML input'
      return
    }

    try {
      if (mode === 'beautify') {
        output = formatHTML(input)
      } else {
        output = minifyHTML(input)
      }
    } catch (e) {
      error = 'Error processing HTML: ' + (e.message || 'Unknown error')
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
      localStorage.removeItem('devutils-html-input')
      localStorage.removeItem('devutils-html-mode')
    } catch (e) {
      error = 'Failed to clear localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function loadExample() {
    input = EXAMPLE_HTML
    process()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">HTML Formatter</h1>
      <p class="tool-desc">Beautify, minify, and clean HTML</p>
    </div>
    <div class="tool-actions">
      <div class="segmented">
        <button class="segment" class:active={mode === 'beautify'} on:click={() => setMode('beautify')}>Beautify</button>
        <button class="segment" class:active={mode === 'minify'} on:click={() => setMode('minify')}>Minify</button>
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

  {#if mode === 'minify'}
    <div class="options-bar">
      <label class="option">
        <input type="checkbox" bind:checked={removeComments} on:change={debouncedProcess}>
        <span>Remove comments</span>
      </label>
      <label class="option">
        <input type="checkbox" bind:checked={removeWhitespace} on:change={debouncedProcess}>
        <span>Remove extra whitespace</span>
      </label>
    </div>
  {/if}

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
        <span class="editor-label">HTML Input</span>
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea 
        bind:value={input} 
        on:input={debouncedProcess} 
        placeholder="Paste HTML here..." 
        class="editor-textarea" 
        spellcheck="false"
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">HTML Output</span>
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
  
  .options-bar { 
    display: flex; 
    gap: var(--space-4); 
    padding: var(--space-3); 
    background: var(--bg-surface); 
    border: 1px solid var(--border-subtle); 
    border-radius: var(--radius-md); 
  }
  
  .option { 
    display: flex; 
    align-items: center; 
    gap: var(--space-2); 
    font-size: var(--text-sm); 
    color: var(--text-secondary); 
    cursor: pointer; 
  }
  
  .option input { 
    cursor: pointer; 
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
    
    .options-bar { 
      flex-wrap: wrap; 
    } 
  }
</style>
