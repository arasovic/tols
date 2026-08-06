<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import Workbench from '$lib/ui/Workbench.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount, onDestroy } from 'svelte'

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

  const MAX_INPUT_SIZE = 1024 * 1024 // 1MB

  let input = ''
  let output = ''
  let error = ''
  let mode = 'beautify'
  let removeComments = false
  let removeWhitespace = false
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimeout = null

  // Declared once so the visible command and the ⌘⇧C payload cannot drift:
  // writing `mode === 'beautify' ? 'fmt' : 'min'` a second time is how a
  // renamed action ends up displayed in one place and copied in another.
  $: cliAction = mode === 'beautify' ? 'fmt' : 'min'
  $: cliFlags = mode === 'minify'
    ? { 'remove-comments': removeComments, 'remove-whitespace': removeWhitespace }
    : {}

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-html-input')
      const savedMode = localStorage.getItem('devutils-html-mode')
      if (savedInput) input = savedInput
      else input = EXAMPLE_HTML
      if (savedMode) mode = savedMode
    } catch (/** @type {any} */ e) {
      console.error('Failed to load from localStorage:', e)
      input = EXAMPLE_HTML
      error = 'Failed to load saved content. Using default example.'
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem('devutils-html-input', input)
          localStorage.setItem('devutils-html-mode', mode)
        } catch (/** @type {any} */ e) {
          console.error('Failed to save to localStorage:', e)
        }
      }, 500)
    } catch (/** @type {any} */ e) {
      console.error('Failed to schedule save:', e)
    }
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

  onDestroy(() => {
    if (timeout) clearTimeout(timeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })

  // Void elements that don't need closing tags
  const VOID_ELEMENTS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
    'param', 'source', 'track', 'wbr'
  ])

  // Elements where whitespace is significant
  const PRESERVE_WHITESPACE = new Set(['pre', 'code', 'textarea', 'script', 'style'])

  /**
   * @typedef {(
   *   | { type: 'comment' | 'doctype' | 'text', content: string }
   *   | { type: 'close', name: string }
   *   | { type: 'open' | 'self-closing', name: string, content: string }
   * )} HtmlToken
   */

  /**
   * @param {string} html
   */
  function formatHTML(html) {
    let formatted = ''
    let indent = 0
    const tab = '  '
    
    // Tokenize HTML
    /** @type {HtmlToken[]} */
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
        } else if (html.substring(i, i + 9).toLowerCase() === '<!doctype' || html.substring(i, i + 9).toUpperCase() === '<!DOCTYPE') {
          // DOCTYPE - case insensitive match
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
            if (!PRESERVE_WHITESPACE.has(token.name)) {
              indent = Math.max(0, indent - 1)
            }
          } else {
            // Mismatched tag - find matching tag in stack
            const stackIndex = tagStack.lastIndexOf(token.name)
            if (stackIndex !== -1) {
              // Remove all tags from stackIndex onwards and adjust indent
              const tagsToRemove = tagStack.length - stackIndex
              for (let k = stackIndex; k < tagStack.length; k++) {
                if (!PRESERVE_WHITESPACE.has(tagStack[k])) {
                  indent = Math.max(0, indent - 1)
                }
              }
              tagStack.splice(stackIndex)
            }
            // If not found, keep current indent
          }
          formatted += tab.repeat(Math.max(0, indent)) + '</' + token.name + '>\n'
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
              // Text content should NOT be escaped - it's already plain text
              formatted += tab.repeat(indent) + trimmed + '\n'
            }
          }
          break
      }
    }
    
    return formatted.trim() || escapeHtml(html)
  }

  /**
   * @param {string} str
   */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  }

  /**
   * @param {string} html
   */
  function minifyHTML(html) {
    // Protect whitespace-sensitive elements during minification
    /** @type {{ placeholder: string, content: string }[]} */
    const protectedBlocks = []
    let protectedIndex = 0
    
    // Replace whitespace-sensitive content with placeholders
    const WHITESPACE_SENSITIVE = /<(pre|code|textarea|script|style)[^>]*>[\s\S]*?<\/\1>/gi
    /** @param {string} match */
    let protectedHtml = html.replace(WHITESPACE_SENSITIVE, (match) => {
      const placeholder = `___PROTECTED_${protectedIndex}___`
      protectedBlocks.push({ placeholder, content: match })
      protectedIndex++
      return placeholder
    })
    
    let minified = protectedHtml
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
    
    // Restore protected blocks
    protectedBlocks.forEach(({ placeholder, content }) => {
      minified = minified.replace(placeholder, content)
    })

    return minified.trim()
  }

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      error = 'Please enter HTML input'
      return
    }

    if (input.length > MAX_INPUT_SIZE) {
      error = `Input exceeds maximum size of ${MAX_INPUT_SIZE / 1024 / 1024}MB. Large files may cause performance issues.`
      return
    }

    try {
      if (mode === 'beautify') {
        output = formatHTML(input)
      } else {
        output = minifyHTML(input)
      }
      saveState()
    } catch (/** @type {any} */ e) {
      error = 'Error processing HTML: ' + (e.message || 'Unknown error')
    }
  }

  function debouncedProcess() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
    }, 300)
  }

  /**
   * @param {string} newMode
   */
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
    } catch (/** @type {any} */ e) {
      console.error('Failed to clear localStorage:', e)
      error = 'Failed to clear saved content.'
    }
  }

  function loadExample() {
    input = EXAMPLE_HTML
    process()
    saveState()
  }
</script>

<div class="tool">
  <ToolHeader toolId="html" />

  <Workbench
    toolId="html"
    action={cliAction}
    flags={cliFlags}
    {input}
    {output}
    onRun={process}
  >
    <textarea
      slot="input"
      bind:value={input}
      on:input={debouncedProcess}
      use:fileDrop={{ onText: (text) => { input = text; process() } }}
      placeholder="Paste HTML here..."
      class="editor-textarea"
      spellcheck="false"
      aria-label="HTML input"
    ></textarea>

    <svelte:fragment slot="output">
      {#if error}
        <div class="error-display" role="alert" aria-live="polite">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
        </div>
      {:else}
        <pre class="output-display" aria-live="polite">{output || 'Output will appear here...'}</pre>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="rail">
      <!--
        The segments carry NO aria-label. Their visible text already is the
        accessible name, and an aria-label that does not contain the visible
        text breaks WCAG 2.5.3 (label in name) for speech-input users.
      -->
      <div class="segmented">
        <button type="button" class="segment" class:active={mode === 'beautify'} on:click={() => setMode('beautify')}>Beautify</button>
        <button type="button" class="segment" class:active={mode === 'minify'} on:click={() => setMode('minify')}>Minify</button>
      </div>
      {#if mode === 'minify'}
        <div class="options-bar">
          <label class="option" for="remove-comments">
            <input type="checkbox" id="remove-comments" bind:checked={removeComments} on:change={debouncedProcess}>
            <span>Remove comments</span>
          </label>
          <label class="option" for="remove-whitespace">
            <input type="checkbox" id="remove-whitespace" bind:checked={removeWhitespace} on:change={debouncedProcess}>
            <span>Remove extra whitespace</span>
          </label>
        </div>
      {/if}
      <Button class="icon-btn" aria-label="Load Example" title="Load Example" on:click={loadExample}>example</Button>
      <Button class="icon-btn" aria-label="Clear" title="Clear" on:click={clear}>clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
      {#if output}<CopyButton text={output} />{/if}
      <ShareButton getState={() => ({ input, mode })} />
    </svelte:fragment>
  </Workbench>
</div>

<style>
  /*
    Everything the two-column grid, the pane boxes, the pane headers and the
    icon buttons used to own now belongs to Workbench / Panel / ActionRail /
    Button. What is genuinely specific to the HTML tool: the pane contents, the
    beautify/minify mode switch, and the minify options.
  */
  .tool { 
    display: flex; 
    flex-direction: column; 
    gap: var(--space-4); 
    width: 100%;
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
    transition: all var(--transition-fast) var(--ease-out); 
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

  .error-display {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--pane-min-height);
    padding: var(--space-3) var(--space-4);
    background: var(--error-soft);
    color: var(--error-text);
    border-radius: var(--radius-md);
  }

  .options-bar { 
    display: flex; 
    gap: var(--space-4); 
    padding: var(--space-2) var(--space-3); 
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

  .editor-textarea { 
    width: 100%;
    height: 100%;
    min-height: var(--pane-min-height);
    padding: var(--space-3); 
    color: var(--text-primary); 
    font-family: var(--font-mono); 
    font-size: var(--text-sm); 
    line-height: var(--leading-snug); 
    background: transparent; 
    border: none; 
    resize: none; 
    tab-size: 2;
  }

  .editor-textarea::placeholder { 
    color: var(--text-muted); 
  }

  .output-display { 
    height: 100%;
    min-height: var(--pane-min-height);
    margin: 0; 
    padding: var(--space-3); 
    color: var(--text-primary); 
    font-family: var(--font-mono); 
    font-size: var(--text-sm); 
    line-height: var(--leading-snug); 
    white-space: pre-wrap; 
    word-wrap: break-word; 
    overflow: auto; 
  }

  @media (max-width: 768px) { 
    .options-bar { 
      flex-wrap: wrap; 
    } 
  }
</style>
