<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import Workbench from '$lib/ui/Workbench.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount } from 'svelte'
  import { format, minify } from 'tols-cli/core/css'

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

  // Declared once so the visible command and the ⌘⇧C payload cannot drift:
  // writing `mode === 'beautify' ? 'fmt' : 'min'` a second time is how a
  // renamed action ends up displayed in one place and copied in another.
  $: cliAction = mode === 'beautify' ? 'fmt' : 'min'

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
      output = mode === 'beautify' ? format(input) : minify(input)
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
  <ToolHeader toolId="css" />

  <Workbench
    toolId="css"
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
      placeholder="Paste CSS here..."
      class="editor-textarea"
      spellcheck="false"
      aria-label="CSS input"
    ></textarea>

    <svelte:fragment slot="output">
      {#if error}
        <div class="error-bar" role="alert">{error}</div>
      {:else}
        <pre class="output-display">{output || 'Output will appear here...'}</pre>
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
      <Button class="icon-btn" aria-label="Load example CSS" title="Load Example" on:click={loadExample}>example</Button>
      <Button class="icon-btn" aria-label="Clear input and output" title="Clear" on:click={clear}>clear</Button>
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
    Button. What is genuinely specific to the CSS tool: the pane contents and
    the beautify/minify mode switch.
  */
  .tool { display: flex; flex-direction: column; gap: var(--space-4); width: 100%; }
  .segmented { display: flex; background: var(--bg-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius); padding: 2px; }
  .segment { display: flex; align-items: center; padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-secondary); background: transparent; border: none; cursor: pointer; transition: all var(--transition-fast) var(--ease-out); }
  .segment:hover { color: var(--text-primary); }
  .segment.active { background: var(--bg-surface); color: var(--text-primary); border: 1px solid var(--border-default); box-shadow: var(--shadow-xs); }
  .editor-textarea { width: 100%; height: 100%; min-height: var(--pane-min-height); padding: var(--space-3); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); background: transparent; border: none; resize: none; tab-size: 2; }
  .editor-textarea::placeholder { color: var(--text-muted); }
  .output-display { height: 100%; min-height: var(--pane-min-height); margin: 0; padding: var(--space-3); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); white-space: pre-wrap; word-wrap: break-word; overflow: auto; }
  .error-bar { padding: var(--space-3); margin-bottom: var(--space-2); background: var(--error-soft, rgba(239, 68, 68, 0.1)); border: 1px solid var(--error, #ef4444); border-radius: var(--radius-md); color: var(--error, #ef4444); font-size: var(--text-sm); }
</style>
