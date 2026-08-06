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
  import {
    parse as parseYAML,
    stringify as stringifyYAML,
    stringifyFlow as flowYAML
  } from 'tols-cli/core/yaml'

  const EXAMPLE_YAML = `name: tols
version: 1.0.0
features:
  - JSON formatter
  - Base64 encoder
  - UUID generator
config:
  debug: true
  timeout: 30`

  const EXAMPLE_JSON = {
    name: "tols",
    version: "1.0.0",
    features: ["JSON formatter", "Base64 encoder", "UUID generator"],
    config: { debug: true, timeout: 30 }
  }

  const DEBOUNCE_MS = 300
  const SAVE_DEBOUNCE_MS = 500
  const MAX_INPUT_SIZE = 1024 * 1024 // 1MB

  let input = ''
  let output = ''
  let error = ''
  let mode = 'yaml-to-json'
  /** @type {ReturnType<typeof setTimeout> | null} */
  let timeout = null
  /** @type {ReturnType<typeof setTimeout> | null} */
  let saveTimeout = null
  let mounted = false

  // Declared once so the visible command and the ⌘⇧C payload cannot drift:
  // writing this mapping a second time is how a renamed action ends up
  // displayed in one place and copied in another.
  //
  // `json` converts YAML to JSON. `fmt` normalizes YAML by parsing and
  // re-serializing, which is exactly what JSON→YAML does here — YAML is a
  // superset of JSON, so the CLI reaches the same output from the same input.
  //
  // `min` collapses to YAML flow style (`{a: 1, b: [2, 3]}`), which is a real
  // YAML document and parses back to what went in. It used to collapse the
  // block output's newlines to spaces, and `a: 1\nb: 2` flattened to `a: 1 b: 2`
  // re-parses as the single key `a` with the rest swallowed into its value —
  // silent data loss, and no CLI command could be shown because no command
  // produced it.
  $: cliAction = mode === 'yaml-to-json' ? 'json' : mode === 'minify' ? 'min' : 'fmt'
  $: cliToolId = 'yaml'

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-yaml-input')
      const savedMode = localStorage.getItem('devutils-yaml-mode')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_YAML
      }
      if (savedMode) mode = savedMode
    } catch (/** @type {any} */ e) {
      input = EXAMPLE_YAML
      console.error('Failed to load from localStorage:', e.message || 'Unknown error')
    }
  }

  function saveState() {
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-yaml-input', input)
        localStorage.setItem('devutils-yaml-mode', mode)
      } catch (/** @type {any} */ e) {
        console.error('Failed to save to localStorage:', e.message || 'Unknown error')
      }
    }, SAVE_DEBOUNCE_MS)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
      if (shared.mode === 'json-to-yaml' || shared.mode === 'yaml-to-json') mode = shared.mode
      process()
    } else {
      loadState()
    }
    mounted = true
    // Process immediately since loadState is synchronous
    if (input && !shared) process()

    return () => {
      if (timeout) clearTimeout(timeout)
      if (saveTimeout) clearTimeout(saveTimeout)
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
      return
    }

    if (input.length > MAX_INPUT_SIZE) {
      error = `Input exceeds maximum size of ${MAX_INPUT_SIZE / 1024 / 1024}MB`
      return
    }

    try {
      if (mode === 'yaml-to-json') {
        const parsed = parseYAML(input)
        output = JSON.stringify(parsed, null, 2)
      } else if (mode === 'json-to-yaml') {
        const parsed = JSON.parse(input)
        output = stringifyYAML(parsed).trim()
      } else if (mode === 'minify') {
        const parsed = parseYAML(input)
        output = flowYAML(parsed)
      }
    } catch (/** @type {any} */ e) {
      error = e.message || 'Invalid format'
    }
  }

  function debouncedProcess() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_MS)
  }

  /**
   * @param {string} newMode
   */
  function setMode(newMode) {
    mode = newMode
    error = ''
    process()
    saveState()
  }

  function clear() {
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-yaml-input')
      localStorage.removeItem('devutils-yaml-mode')
    } catch (/** @type {any} */ e) {
      console.error('Failed to clear localStorage:', e.message || 'Unknown error')
    }
  }

  function loadExample() {
    if (mode === 'yaml-to-json' || mode === 'minify') {
      input = EXAMPLE_YAML
    } else {
      input = JSON.stringify(EXAMPLE_JSON, null, 2)
    }
    error = ''
    process()
    saveState()
  }
</script>

<div class="tool">
  <ToolHeader toolId="yaml" />

  <Workbench
    toolId={cliToolId}
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
      placeholder={mode === 'json-to-yaml' ? 'Enter JSON...' : 'Enter YAML...'}
      class="editor-textarea"
      spellcheck="false"
      aria-label={mode === 'json-to-yaml' ? 'JSON input' : 'YAML input'}
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
        <pre class="output-display" aria-label="Output" role="region">{output || 'Output will appear here...'}</pre>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="rail">
      <div class="segmented" role="tablist" aria-label="Conversion mode">
        <button type="button"
          class="segment"
          class:active={mode === 'yaml-to-json'}
          on:click={() => setMode('yaml-to-json')}
          role="tab"
          aria-selected={mode === 'yaml-to-json'}
          aria-label="Convert YAML to JSON"
        >
          YAML → JSON
        </button>
        <button type="button"
          class="segment"
          class:active={mode === 'json-to-yaml'}
          on:click={() => setMode('json-to-yaml')}
          role="tab"
          aria-selected={mode === 'json-to-yaml'}
          aria-label="Convert JSON to YAML"
        >
          JSON → YAML
        </button>
        <button type="button"
          class="segment"
          class:active={mode === 'minify'}
          on:click={() => setMode('minify')}
          role="tab"
          aria-selected={mode === 'minify'}
          aria-label="Minify YAML"
        >
          Minify
        </button>
      </div>
      <Button class="icon-btn" aria-label="Load example data" title="Load Example" on:click={loadExample}>example</Button>
      <Button class="icon-btn" aria-label="Clear all content" title="Clear" on:click={clear}>clear</Button>
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
    Button. What is genuinely specific to the YAML tool: the pane contents and
    the YAML↔JSON conversion switch.
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
