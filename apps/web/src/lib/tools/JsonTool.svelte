<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import CommandStrip from '$lib/ui/CommandStrip.svelte'
  import Workbench from '$lib/ui/Workbench.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { dispatchShortcut } from '$lib/ui/shortcuts.js'
  import { copyToClipboard } from '$lib/utils/clipboard.js'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount, onDestroy } from 'svelte'

  const EXAMPLE_JSON = `{
  "name": "tols",
  "version": "1.0.0",
  "features": ["JSON", "Base64", "Hash"],
  "active": true
}`

  const PLACEHOLDER_TEXT = '{"name": "Example", "version": "1.0.0"}'
  const MAX_INPUT_SIZE = 1024 * 1024 // 1MB
  const DEBOUNCE_DELAY = 300
  const SAVE_DELAY = 500

  let input = ''
  let output = ''
  let error = ''
  let compact = false
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let saveInProgress = false
  /** @type {CommandStrip | undefined} */
  let strip

  // Declared once so the visible command and the ⌘⇧C payload cannot drift:
  // writing `compact ? 'min' : 'fmt'` a second time is how a renamed action
  // ends up displayed in one place and copied in another.
  $: cliAction = compact ? 'min' : 'fmt'
  $: cliFlags = compact ? {} : { indent: 2 }

  /**
   * Human byte count for a pane header.
   * @param {string} value
   * @returns {string}
   */
  function byteLabel(value) {
    const bytes = new TextEncoder().encode(value).length
    if (bytes < 1024) return `${bytes} B`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    dispatchShortcut(event, {
      run: process,
      copyCommand: () => strip?.copy(),
      copyOutput: () => copyToClipboard(output)
    })
  }

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-json-input')
      const savedCompact = localStorage.getItem('devutils-json-compact')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_JSON
        process()
      }
      if (savedCompact) compact = savedCompact === 'true'
    } catch (/** @type {any} */ e) {
      input = EXAMPLE_JSON
      error = 'Failed to load from localStorage: ' + e.message
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function loadExample() {
    input = EXAMPLE_JSON
    process()
    saveState()
  }

  function saveState() {
    if (saveInProgress) {
      clearTimeout(saveTimeout)
    }
    saveInProgress = true
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-json-input', input)
        localStorage.setItem('devutils-json-compact', compact.toString())
      } catch (/** @type {any} */ e) {
        error = 'Failed to save to localStorage: ' + e.message
        console.warn('Failed to save to localStorage:', e)
      } finally {
        saveInProgress = false
      }
    }, SAVE_DELAY)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
      if (shared.compact === 'true') compact = true
      process()
    } else {
      loadState()
      if (input) process()
    }
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  function validateInputSize() {
    if (input.length > MAX_INPUT_SIZE) {
      error = `Input exceeds maximum size of ${MAX_INPUT_SIZE / 1024 / 1024}MB. Large files may cause performance issues.`
      return false
    }
    return true
  }

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      error = 'Please enter JSON input'
      return
    }

    if (!validateInputSize()) {
      return
    }

    try {
      const parsed = JSON.parse(input)
      output = compact ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2)
    } catch (/** @type {any} */ e) {
      const match = e.message.match(/position (\d+)/i)
      if (match) {
        const position = parseInt(match[1])
        const lines = input.substring(0, position).split('\n')
        const line = lines.length
        const column = lines[lines.length - 1].length + 1
        error = `Invalid JSON at line ${line}, column ${column}`
      } else {
        error = 'Invalid JSON: ' + e.message
      }
    }
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_DELAY)
  }

  function minify() {
    compact = true
    process()
    saveState()
  }

  function prettify() {
    compact = false
    process()
    saveState()
  }

  function clear() {
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-json-input')
      localStorage.removeItem('devutils-json-compact')
    } catch (/** @type {any} */ e) {
      error = 'Failed to clear localStorage: ' + e.message
      console.warn('Failed to clear localStorage:', e)
    }
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="tool">
  <CommandStrip bind:this={strip} toolId="json" action={cliAction} {input} flags={cliFlags} />

  <Workbench inputMeta={byteLabel(input)} outputMeta={byteLabel(output)}>
    <textarea
      slot="input"
      bind:value={input}
      on:input={debouncedProcess}
      use:fileDrop={{ onText: (text) => { input = text; process() } }}
      placeholder={PLACEHOLDER_TEXT}
      class="editor-textarea"
      spellcheck="false"
      aria-label="JSON input"
      aria-describedby={error ? 'json-error' : undefined}
    ></textarea>

    <svelte:fragment slot="output">
      {#if error}
        <div class="error-display" role="alert" id="json-error" aria-live="polite">
          <span>{error}</span>
        </div>
      {:else}
        <pre class="output-display">{output || 'Output will appear here...'}</pre>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="rail">
      <div class="segmented" role="tablist" aria-label="JSON formatting options">
        <button type="button"
          class="segment"
          class:active={!compact}
          on:click={prettify}
          role="tab"
          aria-selected={!compact}
          aria-label="Format JSON with indentation"
        >Prettify</button>
        <button type="button"
          class="segment"
          class:active={compact}
          on:click={minify}
          role="tab"
          aria-selected={compact}
          aria-label="Minify JSON to single line"
        >Minify</button>
      </div>
      <Button class="icon-btn" aria-label="Load example JSON" title="Load Example" on:click={loadExample}>example</Button>
      <Button class="icon-btn" aria-label="Clear input and output" title="Clear" on:click={clear}>clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
      <CopyButton text={output} disabled={!output} />
      <ShareButton getState={() => ({ input, compact: String(compact) })} />
    </svelte:fragment>
  </Workbench>
</div>

<style>
  /*
    Everything this component used to style itself — the two-column grid, the
    panel chrome, the pane headers, the icon buttons — now belongs to
    Workbench / Panel / ActionRail / Button. What is left is only what is
    genuinely specific to the JSON tool: the two pane contents and the
    prettify/minify mode switch.
  */
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  .segmented {
    display: inline-flex;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .segment {
    height: var(--control-height);
    padding: 0 var(--space-3);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: color var(--transition-fast), background var(--transition-fast);
  }

  .segment + .segment { border-left: 1px solid var(--border-subtle); }
  .segment:hover { color: var(--text-primary); }
  .segment:focus-visible { outline: none; box-shadow: var(--glow-focus); }

  .segment.active {
    color: var(--bg-base);
    background: var(--accent);
    font-weight: var(--font-semibold);
  }

  .editor-textarea {
    width: 100%;
    height: 100%;
    min-height: 320px;
    padding: var(--space-3);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    background: transparent;
    border: none;
    resize: none;
    tab-size: 2;
  }

  .editor-textarea:focus { outline: none; }
  .editor-textarea::placeholder { color: var(--text-muted); }

  .output-display {
    margin: 0;
    padding: var(--space-3);
    min-height: 320px;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .error-display {
    display: flex;
    gap: var(--space-2);
    margin: var(--space-3);
    padding: var(--space-3);
    color: var(--error-text);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: var(--error-soft);
    border-left: 2px solid var(--error);
    border-radius: var(--radius);
  }
</style>
