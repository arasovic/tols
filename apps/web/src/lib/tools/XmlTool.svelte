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
  import { format, minify } from 'tols-cli/core/xml'

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

  const MAX_INPUT_SIZE = 10 * 1024 * 1024 // 10MB limit

  let input = ''
  let output = ''
  let error = ''
  let mode = 'format'
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let modeTimeout = null

  // Declared once so the visible command and the ⌘⇧C payload cannot drift:
  // writing `mode === 'format' ? 'fmt' : 'min'` a second time is how a renamed
  // action ends up displayed in one place and copied in another.
  $: cliAction = mode === 'format' ? 'fmt' : 'min'

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-xml-input')
      const savedMode = localStorage.getItem('devutils-xml-mode')
      if (savedInput) input = savedInput
      else input = EXAMPLE_XML
      if (savedMode) mode = savedMode
    } catch (/** @type {any} */ e) {
      input = EXAMPLE_XML
      error = 'Failed to load from localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function saveState() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-xml-input', input)
        localStorage.setItem('devutils-xml-mode', mode)
      } catch (/** @type {any} */ e) {
        // Only show error if not already showing an error
        if (!error) {
          error = 'Failed to save to localStorage: ' + (e.message || 'Unknown error')
        }
      }
    }, 500)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
      if (shared.mode === 'format' || shared.mode === 'minify') mode = shared.mode
      process()
    } else {
      loadState()
      if (input) process()
    }
  })

  onDestroy(() => {
    if (timeout) clearTimeout(timeout)
    if (saveTimeout) clearTimeout(saveTimeout)
    if (modeTimeout) clearTimeout(modeTimeout)
  })

  /**
   * @param {string} xml
   * @returns {string | null}
   */
  function validateXML(xml) {
    // Check max input size
    if (xml.length > MAX_INPUT_SIZE) {
      return `Input exceeds maximum size of ${MAX_INPUT_SIZE / 1024 / 1024}MB`
    }
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')
    
    // Check for parser error - try multiple approaches for cross-browser compatibility
    const parseError = doc.querySelector('parsererror')
    if (parseError) {
      const errorText = parseError.textContent || ''
      // Extract just the first meaningful line, handling different browser formats
      const lines = errorText.split(/\r?\n/).filter(line => line.trim())
      // Look for error description in various formats
      for (const line of lines) {
        const trimmed = line.trim()
        // Skip namespace declarations and generic error prefixes
        if (trimmed && 
            !trimmed.startsWith('xmlns:') && 
            !trimmed.startsWith('http://') &&
            !trimmed.startsWith('XML Parsing Error') &&
            !trimmed.startsWith('Location:') &&
            !trimmed.startsWith('Line Number') &&
            trimmed.length > 5) {
          return trimmed
        }
      }
      // Fallback: return first non-empty line
      return lines[0] || 'Unknown XML parsing error'
    }
    return null
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
        output = format(input)
      } else {
        output = minify(input)
      }
    } catch (/** @type {any} */ e) {
      error = 'Error processing XML: ' + (e.message || 'Unknown error')
    }
  }

  function debouncedProcess() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, 400)
  }

  /**
   * @param {string} newMode
   */
  function setMode(newMode) {
    if (modeTimeout) clearTimeout(modeTimeout)
    modeTimeout = setTimeout(() => {
      mode = newMode
      process()
      saveState()
    }, 50)
  }

  function clear() {
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-xml-input')
      localStorage.removeItem('devutils-xml-mode')
    } catch (/** @type {any} */ e) {
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
  <ToolHeader toolId="xml" />

  <Workbench
    toolId="xml"
    action={cliAction}
    {input}
    {output}
    onRun={process}
  >
    <textarea
      slot="input"
      bind:value={input}
      on:input={debouncedProcess}
      use:fileDrop={{ onText: (text) => { input = text; process() } }}
      placeholder="Paste XML here..."
      class="editor-textarea"
      spellcheck="false"
      aria-label="XML Input"
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
        <pre class="output-display" role="region" aria-label="XML Output">{output || 'Output will appear here...'}</pre>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="rail">
      <!--
        The segments carry NO aria-label. Their visible text already is the
        accessible name, and an aria-label that does not contain the visible
        text breaks WCAG 2.5.3 (label in name) for speech-input users.
      -->
      <div class="segmented">
        <button type="button" class="segment" class:active={mode === 'format'} on:click={() => setMode('format')}>Format</button>
        <button type="button" class="segment" class:active={mode === 'minify'} on:click={() => setMode('minify')}>Minify</button>
      </div>
      <Button class="icon-btn" aria-label="Load example XML" title="Load Example" on:click={loadExample}>example</Button>
      <Button class="icon-btn" aria-label="Clear input" title="Clear" on:click={clear}>clear</Button>
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
    Button. What is genuinely specific to the XML tool: the pane contents and
    the format/minify mode switch.
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
</style>
