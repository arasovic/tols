<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  const EXAMPLE_MARKDOWN = `# Markdown Example

This is a **bold** text and this is *italic*.

## Code Block

    function greet(name) {
      return "Hello, " + name + "!";
    }

## List

- Item 1
- Item 2
- Item 3

> This is a blockquote.

[Link to DevUtils](#)`

  const DEBOUNCE_DELAY = 300
  const SAVE_DELAY = 500

  const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

  let input = ''
  let htmlOutput = ''
  let error = ''
  let processTimeout = null
  let saveTimeout = null

  function isSafeUrl(url) {
    if (!url || url.startsWith('#') || url.startsWith('/')) {
      return true
    }
    try {
      const parsed = new URL(url, window.location.href)
      return ALLOWED_PROTOCOLS.includes(parsed.protocol)
    } catch {
      return false
    }
  }

  function sanitizeUrl(url) {
    if (!url || url.startsWith('#') || url.startsWith('/')) {
      return url
    }
    try {
      const parsed = new URL(url, window.location.href)
      if (ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
        return url
      }
    } catch {
    }
    return '#'
  }

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-markdown-input')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_MARKDOWN
      }
    } catch (e) {
      input = EXAMPLE_MARKDOWN
      error = 'Failed to load from localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-markdown-input', input)
      }, SAVE_DELAY)
    } catch (e) {
      error = 'Failed to save to localStorage: ' + (e.message || 'Unknown error')
    }
  }

  onMount(() => {
    loadState()
    if (input) process()
  })

  onDestroy(() => {
    if (processTimeout) clearTimeout(processTimeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
  }

  function markdownToHTML(md) {
    let html = md
    const lines = html.split('\n')
    const result = []
    let inCodeBlock = false
    let codeBlockLang = ''
    let codeBlockContent = []
    let inList = false
    let listItems = []
    let listType = ''
    let inBlockquote = false
    let blockquoteLines = []

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i]

      if (line.startsWith('```')) {
        if (inCodeBlock) {
          result.push(`<pre><code${codeBlockLang ? ` class="language-${escapeHtml(codeBlockLang)}"` : ''}>${escapeHtml(codeBlockContent.join('\n'))}</code></pre>`)
          inCodeBlock = false
          codeBlockLang = ''
          codeBlockContent = []
        } else {
          inCodeBlock = true
          codeBlockLang = line.slice(3).trim()
        }
        continue
      }

      if (inCodeBlock) {
        codeBlockContent.push(line)
        continue
      }

      if (/^(---|___|\*\*\*)$/.test(line.trim())) {
        if (inList) {
          result.push(`<${listType}>${listItems.join('')}</${listType}>`)
          inList = false
          listItems = []
          listType = ''
        }
        if (inBlockquote) {
          result.push(`<blockquote>${parseInline(blockquoteLines.join('\n'))}</blockquote>`)
          inBlockquote = false
          blockquoteLines = []
        }
        result.push('<hr>')
        continue
      }

      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
      if (headerMatch) {
        if (inList) {
          result.push(`<${listType}>${listItems.join('')}</${listType}>`)
          inList = false
          listItems = []
          listType = ''
        }
        if (inBlockquote) {
          result.push(`<blockquote>${parseInline(blockquoteLines.join('\n'))}</blockquote>`)
          inBlockquote = false
          blockquoteLines = []
        }
        const level = headerMatch[1].length
        const content = parseInline(headerMatch[2])
        result.push(`<h${level}>${content}</h${level}>`)
        continue
      }

      const quoteMatch = line.match(/^>\s?(.*)$/)
      if (quoteMatch) {
        if (inList) {
          result.push(`<${listType}>${listItems.join('')}</${listType}>`)
          inList = false
          listItems = []
          listType = ''
        }
        inBlockquote = true
        blockquoteLines.push(quoteMatch[1])
        continue
      } else if (inBlockquote) {
        result.push(`<blockquote>${parseInline(blockquoteLines.join('\n'))}</blockquote>`)
        inBlockquote = false
        blockquoteLines = []
      }

      const ulMatch = line.match(/^(\s*)[-*+]\s+(.+)$/)
      const olMatch = line.match(/^(\s*)\d+\.\s+(.+)$/)
      
      if (ulMatch || olMatch) {
        const isOrdered = !!olMatch
        const newListType = isOrdered ? 'ol' : 'ul'
        const content = parseInline((ulMatch || olMatch)[2])
        
        if (!inList || listType !== newListType) {
          if (inList) {
            result.push(`<${listType}>${listItems.join('')}</${listType}>`)
          }
          inList = true
          listType = newListType
          listItems = []
        }
        listItems.push(`<li>${content}</li>`)
        continue
      } else if (inList && line.trim() === '') {
        const nextLine = lines[i + 1]
        const nextUlMatch = nextLine && nextLine.match(/^(\s*)[-*+]\s+(.+)$/)
        const nextOlMatch = nextLine && nextLine.match(/^(\s*)\d+\.\s+(.+)$/)
        
        if (!nextUlMatch && !nextOlMatch) {
          result.push(`<${listType}>${listItems.join('')}</${listType}>`)
          inList = false
          listItems = []
          listType = ''
        } else {
          const nextIsOrdered = !!nextOlMatch
          const nextListType = nextIsOrdered ? 'ol' : 'ul'
          
          if (listType !== nextListType) {
            result.push(`<${listType}>${listItems.join('')}</${listType}>`)
            inList = false
            listItems = []
            listType = ''
          }
        }
        continue
      } else if (inList) {
        result.push(`<${listType}>${listItems.join('')}</${listType}>`)
        inList = false
        listItems = []
        listType = ''
      }

      if (line.startsWith('    ')) {
        const codeLines = []
        while (i < lines.length) {
          const currentLine = lines[i]
          if (currentLine.startsWith('    ')) {
            codeLines.push(currentLine.slice(4))
            i++
          } else if (currentLine.trim() === '') {
            codeLines.push('')
            i++
          } else {
            break
          }
        }
        i--
        result.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`)
        continue
      }

      if (line.trim()) {
        result.push(`<p>${parseInline(line)}</p>`)
      }
    }

    if (inList) {
      result.push(`<${listType}>${listItems.join('')}</${listType}>`)
    }
    if (inBlockquote) {
      result.push(`<blockquote>${parseInline(blockquoteLines.join('\n'))}</blockquote>`)
    }

    return result.join('\n')
  }

  function parseInline(text) {
    let html = escapeHtml(text)

    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')

    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>')

    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>')

    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      const safeSrc = sanitizeUrl(src)
      return `<img src="${safeSrc}" alt="${alt}">`
    })

    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      const safeUrl = sanitizeUrl(url)
      return `<a href="${safeUrl}">${label}</a>`
    })

    html = html.replace(/  $/gm, '<br>')

    return html
  }

  function process() {
    error = ''

    if (!input.trim()) {
      htmlOutput = ''
      return
    }

    try {
      htmlOutput = markdownToHTML(input)
    } catch (e) {
      error = 'Error parsing markdown: ' + (e.message || 'Unknown error')
      htmlOutput = ''
    }
  }

  function debouncedProcess() {
    if (processTimeout) clearTimeout(processTimeout)
    processTimeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_DELAY)
  }

  function clear() {
    input = ''
    htmlOutput = ''
    error = ''
    try {
      localStorage.removeItem('devutils-markdown-input')
    } catch (e) {
      error = 'Failed to clear localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function loadExample() {
    input = EXAMPLE_MARKDOWN
    process()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">Markdown Previewer</h1>
      <p class="tool-desc">Live preview and convert Markdown to HTML</p>
    </div>
    <div class="tool-actions">
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
        <span class="editor-label">Markdown</span>
        <span class="char-count">{input.length} chars</span>
      </div>
      <textarea 
        bind:value={input} 
        on:input={debouncedProcess} 
        placeholder="Type markdown here..." 
        class="editor-textarea" 
        spellcheck="false"
        aria-label="Markdown input"
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">Preview</span>
        <div class="editor-meta">
          {#if htmlOutput}
            <CopyButton text={htmlOutput} />
          {/if}
        </div>
      </div>
      <div 
        class="preview-display" 
        role="region" 
        aria-label="Preview"
        aria-live="polite"
      >
        {#if htmlOutput}
          {@html htmlOutput}
        {:else}
          <span class="placeholder">Preview will appear here...</span>
        {/if}
      </div>
    </div>
  </div>

  {#if htmlOutput}
    <div class="html-output">
      <div class="html-header">
        <span>HTML Output</span>
        <CopyButton text={htmlOutput} />
      </div>
      <pre class="html-code">{htmlOutput}</pre>
    </div>
  {/if}
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
  
  .preview-display { 
    flex: 1; 
    padding: var(--space-3); 
    background: var(--bg-surface); 
    color: var(--text-primary); 
    overflow: auto; 
  }
  
  .preview-display :global(h1) { 
    font-size: var(--text-2xl); 
    font-weight: var(--font-semibold); 
    margin-bottom: var(--space-4); 
  }
  
  .preview-display :global(h2) { 
    font-size: var(--text-xl); 
    font-weight: var(--font-semibold); 
    margin-top: var(--space-4); 
    margin-bottom: var(--space-2); 
  }
  
  .preview-display :global(h3) { 
    font-size: var(--text-lg); 
    font-weight: var(--font-semibold); 
    margin-top: var(--space-3); 
    margin-bottom: var(--space-2); 
  }
  
  .preview-display :global(p) { 
    margin-bottom: var(--space-2); 
    line-height: var(--leading-relaxed); 
  }
  
  .preview-display :global(ul), 
  .preview-display :global(ol) { 
    margin-left: var(--space-4); 
    margin-bottom: var(--space-2); 
  }
  
  .preview-display :global(li) { 
    margin-bottom: var(--space-1); 
  }
  
  .preview-display :global(code) { 
    background: var(--bg-elevated); 
    padding: 2px 4px; 
    border-radius: var(--radius-sm); 
    font-family: var(--font-mono); 
    font-size: var(--text-sm); 
  }
  
  .preview-display :global(pre) { 
    background: var(--bg-elevated); 
    padding: var(--space-3); 
    border-radius: var(--radius-md); 
    overflow-x: auto; 
    margin-bottom: var(--space-2); 
  }
  
  .preview-display :global(pre code) { 
    background: transparent; 
    padding: 0; 
  }
  
  .preview-display :global(blockquote) { 
    border-left: 3px solid var(--accent); 
    padding-left: var(--space-3); 
    margin-left: 0; 
    margin-bottom: var(--space-2); 
    color: var(--text-secondary); 
  }
  
  .preview-display :global(a) { 
    color: var(--accent); 
    text-decoration: none; 
  }
  
  .preview-display :global(a:hover) { 
    text-decoration: underline; 
  }
  
  .preview-display :global(strong) { 
    font-weight: var(--font-semibold); 
  }
  
  .preview-display :global(em) { 
    font-style: italic; 
  }
  
  .placeholder { 
    color: var(--text-muted); 
  }
  
  .html-output { 
    background: var(--bg-surface); 
    border: 1px solid var(--border-subtle); 
    border-radius: var(--radius-md); 
    overflow: hidden; 
  }
  
  .html-header { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    padding: var(--space-2) var(--space-3); 
    background: var(--bg-elevated); 
    border-bottom: 1px solid var(--border-subtle); 
    font-size: var(--text-xs); 
    font-weight: var(--font-semibold); 
    text-transform: uppercase; 
    letter-spacing: var(--tracking-wide); 
    color: var(--text-tertiary); 
  }
  
  .html-code { 
    margin: 0; 
    padding: var(--space-3); 
    background: var(--bg-surface); 
    color: var(--text-primary); 
    font-family: var(--font-mono); 
    font-size: var(--text-sm); 
    line-height: var(--leading-snug); 
    white-space: pre-wrap; 
    word-wrap: break-word; 
    overflow: auto; 
    max-height: 200px; 
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
