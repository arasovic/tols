<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount, onDestroy } from 'svelte'
  import { parse as parseYAML, stringify as stringifyYAML } from 'tols/core/yaml'

  const EXAMPLE_YAML = `name: DevUtils
version: 1.0.0
features:
  - JSON formatter
  - Base64 encoder
  - UUID generator
config:
  debug: true
  timeout: 30`

  const EXAMPLE_JSON = {
    name: "DevUtils",
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
        output = stringifyYAML(parsed).replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
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
  <ToolHeader toolId="yaml">
    <svelte:fragment slot="actions">
      <ShareButton getState={() => ({ input, mode })} />
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
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
      <button type="button" class="icon-btn" on:click={loadExample} title="Load Example" aria-label="Load example data">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button type="button" class="icon-btn" on:click={clear} title="Clear" aria-label="Clear all content">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </svelte:fragment>
  </ToolHeader>

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
        <span class="editor-label">{mode === 'json-to-yaml' ? 'JSON Input' : 'YAML Input'}</span>
        <span class="char-count" aria-label="Character count">{input.length} chars</span>
      </div>
      <textarea
        bind:value={input}
        on:input={debouncedProcess}
        use:fileDrop={{ onText: (text) => { input = text; process() } }}
        placeholder={mode === 'json-to-yaml' ? 'Enter JSON...' : 'Enter YAML...'}
        class="editor-textarea"
        spellcheck="false"
        aria-label={mode === 'json-to-yaml' ? 'JSON input' : 'YAML input'}
      ></textarea>
    </div>

    <div class="editor">
      <div class="editor-header">
        <span class="editor-label">{mode === 'json-to-yaml' ? 'YAML Output' : 'JSON Output'}</span>
        <div class="editor-meta">
          {#if output}
            <span class="char-count" aria-label="Output character count">{output.length} chars</span>
            <CopyButton text={output} />
          {/if}
        </div>
      </div>
      <pre class="output-display" aria-label="Output" role="region">{output || 'Output will appear here...'}</pre>
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
    transition: all var(--transition-fast) var(--ease-out);
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
  }
</style>
