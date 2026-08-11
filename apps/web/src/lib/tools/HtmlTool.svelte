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
  import { format, minify } from 'tols-cli/core/html'

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
      output = mode === 'beautify'
        ? format(input)
        : minify(input, { removeComments, removeWhitespace })
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
    gap: 0;
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
