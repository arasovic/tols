<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ShareButton from '$lib/components/ShareButton.svelte'
  import PasteButton from '$lib/components/PasteButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import FactStrip from '$lib/ui/FactStrip.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { onMount, onDestroy } from 'svelte'
  import { encode, decode } from 'tols-cli/core/url'

  const EXAMPLE_URL = 'https://example.com/path?name=John&age=30'
  const DEBOUNCE_DELAY_MS = 150
  const SAVE_DEBOUNCE_DELAY_MS = 500
  const MAX_INPUT_LENGTH = 100000

  let input = ''
  let output = ''
  let mode = 'encode'
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout

  // Declared once so the strip and the ⌘⇧C payload cannot drift.
  $: cliAction = mode === 'encode' ? 'enc' : 'dec'

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-url-input')
      const savedMode = localStorage.getItem('devutils-url-mode')
      if (savedInput) {
        input = savedInput
      }
      if (savedMode) mode = savedMode
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-url-input', input)
        localStorage.setItem('devutils-url-mode', mode)
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, SAVE_DEBOUNCE_DELAY_MS)
  }

  onMount(() => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.input === 'string') {
      input = shared.input
      if (shared.mode === 'encode' || shared.mode === 'decode') mode = shared.mode
      process()
      return
    }

    loadState()
    if (input.trim()) {
      process()
    } else {
      input = EXAMPLE_URL
      process()
      saveState()
    }
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  function process() {
    error = ''
    output = ''

    if (!input.trim()) {
      output = ''
      error = ''
      return
    }

    try {
      if (mode === 'encode') {
        output = encode(input)
      } else {
        output = decode(input)
      }
    } catch (/** @type {any} */ e) {
      error = mode === 'encode'
        ? 'Invalid input for URL encoding'
        : 'Invalid input for URL decoding'
    }
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_DELAY_MS)
  }

  function clear() {
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-url-input')
      localStorage.removeItem('devutils-url-mode')
    } catch (/** @type {any} */ e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    input = EXAMPLE_URL
    process()
    saveState()
  }

  /**
   * @param {string} newMode
   */
  function setMode(newMode) {
    mode = newMode
    process()
    saveState()
  }

  function debouncedSave() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      saveState()
    }, SAVE_DEBOUNCE_DELAY_MS)
  }

  function extractFromURL() {
    try {
      const url = new URL(input)
      const path = url.pathname + url.search + url.hash
      input = path
      output = encodeURIComponent(path)
      mode = 'encode'
      error = ''
      debouncedSave()
    } catch (/** @type {any} */ e) {
      error = 'Invalid URL format'
    }
  }

  function extractPath() {
    try {
      const url = new URL(input)
      input = url.pathname
      output = encodeURIComponent(url.pathname)
      mode = 'encode'
      error = ''
      debouncedSave()
    } catch (/** @type {any} */ e) {
      error = 'Invalid URL format'
    }
  }

  function extractParams() {
    try {
      const url = new URL(input)
      const params = new URLSearchParams(url.search)
      const paramsString = params.toString()
      input = paramsString
      output = encodeURIComponent(paramsString)
      mode = 'encode'
      error = ''
      debouncedSave()
    } catch (/** @type {any} */ e) {
      error = 'Invalid URL format'
    }
  }

  function getPlaceholderText() {
    return mode === 'encode'
      ? 'Enter text to encode (e.g., https://example.com/path)...'
      : 'Enter URL-encoded string to decode (e.g., hello%20world)...'
  }

  function getEmptyStateText() {
    return mode === 'encode' ? 'Enter text to encode' : 'Enter encoded string to decode'
  }
</script>

<div class="tool">
  <ToolHeader toolId="url" />

  <ToolShell
    toolId="url"
    action={cliAction}
    {input}
    {output}
    onRun={process}
  >
    <div class="mode-toggle" role="tablist" aria-label="Mode selection">
      <button
        type="button"
        class="mode-btn"
        class:active={mode === 'encode'}
        role="tab"
        aria-selected={mode === 'encode'}
        on:click={() => setMode('encode')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <line x1="17" y1="10" x2="3" y2="10"></line>
          <line x1="21" y1="6" x2="3" y2="6"></line>
          <line x1="21" y1="14" x2="3" y2="14"></line>
          <line x1="17" y1="18" x2="3" y2="18"></line>
        </svg>
        Encode
      </button>
      <button
        type="button"
        class="mode-btn"
        class:active={mode === 'decode'}
        role="tab"
        aria-selected={mode === 'decode'}
        on:click={() => setMode('decode')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Decode
      </button>
    </div>

    <PanelGroup>
      <Panel
        label={mode === 'encode' ? 'Text Input' : 'Encoded Input'}
        meta="{input.length} chars"
        data-testid="input-char-count"
      >
        <textarea
          bind:value={input}
          on:input={debouncedProcess}
          use:fileDrop={{ onText: (text) => { input = text; process() } }}
          placeholder={getPlaceholderText()}
          class="input-area"
          spellcheck="false"
          maxlength={MAX_INPUT_LENGTH}
          aria-label={mode === 'encode' ? 'Text to encode' : 'URL-encoded text to decode'}
        ></textarea>
      </Panel>

      <Panel
        label={mode === 'encode' ? 'Encoded Output' : 'Decoded Output'}
        meta={output ? `${output.length} chars` : ''}
        data-testid="output-char-count"
      >
        {#if error}
          <div class="error-state" role="alert" aria-live="assertive">
            <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        {:else if output}
          <div class="output-content mono" data-testid="output-content">{output}</div>
        {:else}
          <div class="empty-state">
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>{getEmptyStateText()}</span>
          </div>
        {/if}
      </Panel>
    </PanelGroup>

    <FactStrip
      facts={[
        {
          label: 'Mode',
          value: mode === 'encode' ? 'Encoding' : 'Decoding',
          presentation: mode === 'encode' ? 'accent' : 'info'
        },
        ...(output
          ? [{ label: 'Output length', value: `${output.length} characters` }]
          : [])
      ]}
    />

    <svelte:fragment slot="rail">
      {#if mode === 'encode'}
        <Button
          on:click={extractFromURL}
          aria-label="Extract path, query and hash from URL"
          title="Extract path, query and hash from URL"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
          Extract Path+Params
        </Button>
        <Button
          on:click={extractPath}
          aria-label="Extract pathname from URL"
          title="Extract pathname from URL"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          Path
        </Button>
        <Button
          on:click={extractParams}
          aria-label="Extract query parameters from URL"
          title="Extract query parameters from URL"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
          Params
        </Button>
      {/if}
      <Button on:click={loadExample} aria-label="Load example">example</Button>
      <Button on:click={clear} aria-label="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { input = e.detail.text; process() }} />
      {#if output}<CopyButton text={output} />{/if}
      <ShareButton getState={() => ({ input, mode })} />
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  .mode-toggle {
    display: flex;
    background: var(--bg-elevated);
    border-radius: var(--radius);
    padding: 3px;
    border: 1px solid var(--border-subtle);
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: transparent;
    transition: all var(--transition) var(--ease-out);
    border: none;
    cursor: pointer;
  }

  .mode-btn:hover {
    color: var(--text-primary);
  }

  .mode-btn.active {
    background: var(--accent);
    color: white;
    box-shadow: var(--shadow-accent-sm);
  }

  .input-area {
    flex: 1;
    min-height: 280px;
    padding: var(--space-3);
    border: none;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    resize: vertical;
  }

  .input-area:focus {
    outline: none;
  }

  .input-area::placeholder {
    color: var(--text-disabled);
  }

  .output-content {
    flex: 1;
    min-height: 280px;
    padding: var(--space-3);
    background: var(--bg-base);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow: auto;
  }

  .error-state {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--error-subtle);
    border-top: 1px solid var(--error-muted);
    color: var(--error);
    font-size: var(--text-sm);
  }

  .error-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 1px;
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 280px;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  .empty-icon {
    width: 32px;
    height: 32px;
    opacity: 0.5;
  }
</style>