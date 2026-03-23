<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<catalog>
  <book id="bk101">
    <author>Gambardella, Matthew</author>
    <title>XML Developer's Guide</title>
    <genre>Computer</genre>
    <price>44.95</price>
    <publish_date>2000-10-01</publish_date>
    <description>An in-depth look at creating applications with XML.</description>
  </book>
  <book id="bk102">
    <author>Ralls, Kim</author>
    <title>Midnight Rain</title>
    <genre>Fantasy</genre>
    <price>5.95</price>
    <publish_date>2000-12-16</publish_date>
    <description>A former architect battles corporate zombies.</description>
  </book>
</catalog>`

  let input = ''
  let output = ''
  let error = ''
  let mode = 'format'
  let timeout = null
  let saveTimeout = null

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-xml-input')
      const savedMode = localStorage.getItem('devutils-xml-mode')
      if (savedInput) input = savedInput
      else input = EXAMPLE_XML
      if (savedMode) mode = savedMode
    } catch (e) {
      input = EXAMPLE_XML
      error = 'Failed to load from localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-xml-input', input)
        localStorage.setItem('devutils-xml-mode', mode)
      }, 500)
    } catch (e) {
      error = 'Failed to save to localStorage: ' + (e.message || 'Unknown error')
    }
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

  function formatXML(xml) {
    let formatted = ''
    let indent = 0
    const tab = '  '
    
    // Tokenize XML - handle tags, text, CDATA, comments, and processing instructions
    const tokens = []
    let i = 0
    
    while (i < xml.length) {
      if (xml[i] === '<') {
        // Check for various types of tags
        if (xml.substring(i, i + 4) === '<!--') {
          // Comment
          const end = xml.indexOf('-->', i)
          if (end === -1) break
          tokens.push({ type: 'comment', content: xml.substring(i, end + 3) })
          i = end + 3
        } else if (xml.substring(i, i + 9) === '<![CDATA[') {
          // CDATA
          const end = xml.indexOf(']]>', i)
          if (end === -1) break
          tokens.push({ type: 'cdata', content: xml.substring(i, end + 3) })
          i = end + 3
        } else if (xml.substring(i, i + 2) === '<?') {
          // Processing instruction
          const end = xml.indexOf('?>', i)
          if (end === -1) break
          tokens.push({ type: 'pi', content: xml.substring(i, end + 2) })
          i = end + 2
        } else if (xml.substring(i, i + 2) === '</') {
          // Closing tag
          const end = xml.indexOf('>', i)
          if (end === -1) break
          const tagName = xml.substring(i + 2, end).trim().split(/\s+/)[0]
          tokens.push({ type: 'close', name: tagName })
          i = end + 1
        } else {
          // Opening or self-closing tag
          const end = xml.indexOf('>', i)
          if (end === -1) break
          const tagContent = xml.substring(i + 1, end)
          const isSelfClosing = tagContent.endsWith('/')
          const actualContent = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent.trim()
          const tagName = actualContent.split(/\s+/)[0]
          const attrs = actualContent.substring(tagName.length).trim()
          
          tokens.push({ 
            type: isSelfClosing ? 'self-closing' : 'open', 
            name: tagName,
            attrs: attrs,
            full: xml.substring(i, end + 1)
          })
          i = end + 1
        }
      } else if (!xml.substring(i).trim()) {
        // Skip whitespace at end
        break
      } else {
        // Text content
        const nextTag = xml.indexOf('<', i)
        let text
        if (nextTag === -1) {
          text = xml.substring(i)
          i = xml.length
        } else {
          text = xml.substring(i, nextTag)
          i = nextTag
        }
        if (text.trim()) {
          tokens.push({ type: 'text', content: text.trim() })
        }
      }
    }
    
    // Format tokens
    const tagStack = []
    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j]
      
      switch (token.type) {
        case 'pi':
        case 'comment':
          formatted += tab.repeat(indent) + token.content + '\n'
          break
        case 'cdata':
          formatted += tab.repeat(indent) + token.content + '\n'
          break
        case 'open':
          formatted += tab.repeat(indent) + token.full + '\n'
          tagStack.push(token.name)
          indent++
          break
        case 'close':
          if (tagStack.length > 0 && tagStack[tagStack.length - 1] === token.name) {
            tagStack.pop()
            indent = Math.max(0, indent - 1)
          }
          formatted += tab.repeat(indent) + '</' + token.name + '>\n'
          break
        case 'self-closing':
          formatted += tab.repeat(indent) + token.full + '\n'
          break
        case 'text':
          formatted += tab.repeat(indent) + escapeXml(token.content) + '\n'
          break
      }
    }
    
    return formatted.trim() || xml
  }

  function escapeXml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  function minifyXML(xml) {
    return xml
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/>\s+</g, '><')
      .trim()
  }

  function validateXML(xml) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')
    const parseError = doc.querySelector('parsererror')
    return parseError ? parseError.textContent.split('\n')[0] : null
  }

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      error = 'Please enter XML input'
      return
    }

    const validationError = validateXML(input)
    if (validationError) {
      error = 'Invalid XML: ' + validationError
      return
    }

    try {
      if (mode === 'format') {
        output = formatXML(input)
      } else {
        output = minifyXML(input)
      }
    } catch (e) {
      error = 'Error processing XML: ' + (e.message || 'Unknown error')
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
      localStorage.removeItem('devutils-xml-input')
      localStorage.removeItem('devutils-xml-mode')
    } catch (e) {
      error = 'Failed to clear localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function loadExample() {
    input = EXAMPLE_XML
    process()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">XML Formatter</h1>
      <p class="tool-desc">Format, validate, and minify XML data</p>
    </div>
    <div class="tool-actions">
      <div class="segmented">
        <button class="segment" class:active={mode === 'format'} on:click={() => setMode('format')}>Format</button>
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
        <span class="editor-label">XML Input</span>
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea 
        bind:value={input} 
        on:input={debouncedProcess} 
        placeholder="Paste XML here..." 
        class="editor-textarea" 
        spellcheck="false"
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">XML Output</span>
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
