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
  import { toHtml } from 'tols-cli/core/markdown'

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

[Link to tols](#)`

  const DEBOUNCE_DELAY = 300
  const SAVE_DELAY = 500
  const MAX_INPUT_SIZE = 1024 * 1024 // 1MB

  let input = ''
  let htmlOutput = ''
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | null} */
  let processTimeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimeout = null

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-markdown-input')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_MARKDOWN
      }
    } catch (/** @type {any} */ e) {
      input = EXAMPLE_MARKDOWN
      error = 'Failed to load from localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function saveState() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-markdown-input', input)
      } catch (/** @type {any} */ e) {
        error = 'Failed to save to localStorage: ' + (e.message || 'Unknown error')
      }
    }, SAVE_DELAY)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
      process()
    } else {
      loadState()
      if (input) process()
    }
  })

  onDestroy(() => {
    if (processTimeout) clearTimeout(processTimeout)
    if (saveTimeout) clearTimeout(saveTimeout)
  })

  function process() {
    error = ''

    if (!input.trim()) {
      htmlOutput = ''
      return
    }

    if (input.length > MAX_INPUT_SIZE) {
      error = `Input exceeds maximum size of ${MAX_INPUT_SIZE / 1024 / 1024}MB. Large files may cause performance issues.`
      htmlOutput = ''
      return
    }

    try {
      htmlOutput = toHtml(input)
    } catch (/** @type {any} */ e) {
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
    } catch (/** @type {any} */ e) {
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
  <ToolHeader toolId="markdown" />

  <Workbench
    toolId="markdown"
    action="html"
    {input}
    output={htmlOutput}
    onRun={process}
  >
    <textarea
      slot="input"
      bind:value={input}
      on:input={debouncedProcess}
      use:fileDrop={{ onText: (text) => { input = text; process() } }}
      placeholder="Type markdown here..."
      class="editor-textarea"
      spellcheck="false"
      aria-label="Markdown input"
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
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="rail">
      <Button class="icon-btn" aria-label="Load Markdown example" title="Load Example" on:click={loadExample}>example</Button>
      <Button class="icon-btn" aria-label="Clear input and output" title="Clear" on:click={clear}>clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
      {#if htmlOutput}<CopyButton text={htmlOutput} />{/if}
      <ShareButton getState={() => ({ input })} />
    </svelte:fragment>
  </Workbench>

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
  /*
    Everything the two-column grid, the pane boxes, the pane headers and the
    icon buttons used to own now belongs to Workbench / Panel / ActionRail /
    Button. What is genuinely specific to the Markdown tool: the rendered
    preview, its typography, the error readout, and the raw HTML source block.
  */
  .tool { 
    display: flex; 
    flex-direction: column; 
    gap: var(--space-4); 
    width: 100%;
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
  
  .preview-display { 
    height: 100%;
    min-height: var(--pane-min-height);
    padding: var(--space-3); 
    background: transparent; 
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
</style>
