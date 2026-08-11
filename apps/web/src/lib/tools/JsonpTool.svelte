<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { onMount, onDestroy } from 'svelte'
  import { isValidUrl, isValidCallback } from 'tols-cli/core/jsonp'

  const EXAMPLE_URL = 'https://api.example.com/data'
  const EXAMPLE_CALLBACK = 'myCallback'
  const DEBOUNCE_DELAY = 300
  const SAVE_DEBOUNCE_DELAY = 500

  /**
   * @typedef {{
   *   status: 'success' | 'error',
   *   data?: object,
   *   error?: string
   * }} JsonpResult
   */

  let url = EXAMPLE_URL
  let callback = EXAMPLE_CALLBACK
  let response = '{"name": "John", "age": 30}'
  let generatedScript = `<script src="${EXAMPLE_URL}?callback=${EXAMPLE_CALLBACK}"><\/script>`
  /** @type {JsonpResult | null} */
  let parsedResult = { status: 'success', data: { name: 'John', age: 30 } }
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let urlInputId = 'jsonp-url'
  let callbackInputId = 'jsonp-callback'
  let responseTextareaId = 'jsonp-response'
  let error = ''

  function isLocalStorageAvailable() {
    try {
      const testKey = '__test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch (/** @type {any} */ e) {
      return false
    }
  }

  /**
   * @param {string} str
   */
  function sanitizeForHtml(str) {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  function loadState() {
    if (!isLocalStorageAvailable()) return
    try {
      const savedUrl = localStorage.getItem('devutils-jsonp-url')
      const savedCallback = localStorage.getItem('devutils-jsonp-callback')
      const savedResponse = localStorage.getItem('devutils-jsonp-response')
      if (savedUrl) url = savedUrl
      if (savedCallback) callback = savedCallback
      if (savedResponse) response = savedResponse
      generateScript()
    } catch (/** @type {any} */ e) {
      console.warn('Failed to load state from localStorage:', e)
    }
  }

  function saveState() {
    if (!isLocalStorageAvailable()) return
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        try {
          localStorage.setItem('devutils-jsonp-url', url)
          localStorage.setItem('devutils-jsonp-callback', callback)
          localStorage.setItem('devutils-jsonp-response', response)
        } catch (/** @type {any} */ e) {
          console.warn('Failed to save state to localStorage:', e)
        }
      }, SAVE_DEBOUNCE_DELAY)
    } catch (/** @type {any} */ e) {
      console.warn('Failed to schedule state save:', e)
    }
  }

  onMount(() => {
    loadState()
    generateScript()
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  function generateScript() {
    // The report flagged the web's validators as dead code; the core's
    // isValidUrl/isValidCallback are now the gate — an invalid URL or
    // callback name would otherwise produce a broken (if harmless, since
    // values are HTML-escaped) script tag.
    generatedScript = ''
    error = ''

    if (!isValidUrl(url)) {
      error = 'Invalid URL. Enter a full URL, e.g. https://api.example.com/data'
      parsedResult = null
      return
    }
    if (!isValidCallback(callback)) {
      error = 'Invalid callback name. Use letters, digits, _ or $ (must not start with a digit)'
      parsedResult = null
      return
    }

    const sanitizedUrl = sanitizeForHtml(url)
    const sanitizedCallback = sanitizeForHtml(callback)
    generatedScript = `<script src="${sanitizedUrl}?callback=${sanitizedCallback}"><\/script>`

    try {
      const data = JSON.parse(response)
      parsedResult = {
        status: 'success',
        data: data
      }
    } catch (/** @type {any} */ e) {
      parsedResult = {
        status: 'error',
        error: 'Invalid JSON response'
      }
    }
  }

  function debouncedGenerate() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      generateScript()
      saveState()
    }, DEBOUNCE_DELAY)
  }

  function clear() {
    url = ''
    callback = ''
    response = ''
    generatedScript = ''
    parsedResult = null
    error = ''
    if (!isLocalStorageAvailable()) return
    try {
      localStorage.removeItem('devutils-jsonp-url')
      localStorage.removeItem('devutils-jsonp-callback')
      localStorage.removeItem('devutils-jsonp-response')
    } catch (/** @type {any} */ e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    url = EXAMPLE_URL
    callback = EXAMPLE_CALLBACK
    response = '{"name": "John", "age": 30}'
    generateScript()
    saveState()
  }
</script>

<div class="tool">
  <!-- toolId is deliberately empty: this tool STRIPS a callback wrapper, while
       the CLI's `jsonp wrap`/`jsonp script` ADD one — inverse operations, so
       no command is the honest mirror (see BRIEF.md). -->
  <ToolHeader toolId="jsonp" />

  <ToolShell
    toolId=""
    output={generatedScript}
    onRun={generateScript}
  >
    <div class="jsonp-inputs">
      <div class="input-row">
        <div class="input-group">
          <label for={urlInputId}>URL</label>
          <input id={urlInputId} type="text" bind:value={url} on:input={debouncedGenerate} placeholder="https://api.example.com/data" />
        </div>
        <div class="input-group callback-group">
          <label for={callbackInputId}>Callback Function</label>
          <input id={callbackInputId} type="text" bind:value={callback} on:input={debouncedGenerate} placeholder="myCallback" />
        </div>
      </div>

      <div class="input-group">
        <label for={responseTextareaId}>Simulated Response (JSON)</label>
        <textarea id={responseTextareaId} bind:value={response} on:input={debouncedGenerate} placeholder='{"{\"key\": \"value\"}"}' class="response-textarea"></textarea>
      </div>
    </div>

    {#if error}
      <div class="error-display" role="alert" aria-live="polite">
        <span>{error}</span>
      </div>
    {/if}

    {#if generatedScript}
      <PanelGroup columns={1}>
        <Panel label="Generated Script Tag">
          <pre class="code-block">{generatedScript}</pre>
        </Panel>
      </PanelGroup>
    {/if}

    {#if parsedResult}
      <PanelGroup columns={1}>
        <Panel label="Parsed Result">
          <div class="result-display" class:success={parsedResult.status === 'success'} class:error={parsedResult.status === 'error'}>
            {#if parsedResult.status === 'success'}
              <pre>{JSON.stringify(parsedResult.data, null, 2)}</pre>
            {:else}
              <span>{parsedResult.error}</span>
            {/if}
          </div>
        </Panel>
      </PanelGroup>
    {/if}

    <div class="info-section">
      <h3>How JSONP Works</h3>
      <p>JSONP (JSON with Padding) is a technique used to bypass cross-origin policy limitations in browsers. It works by:</p>
      <ol>
        <li>Creating a script tag with a URL that includes a callback parameter</li>
        <li>The server wraps the JSON response in the callback function</li>
        <li>The browser executes the script, calling the callback with the data</li>
      </ol>
    </div>

    <svelte:fragment slot="rail">
      <Button on:click={loadExample} title="Load Example" aria-label="Load Example">example</Button>
      <Button on:click={clear} title="Clear" aria-label="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      {#if generatedScript}<CopyButton text={generatedScript} />{/if}
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: 0; width: 100%; }
  .jsonp-inputs { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .input-row { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-4); }
  .input-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .input-group label { font-size: var(--text-xs); font-weight: var(--font-medium); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .input-group input { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-base); outline: none; }
  .input-group input:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .response-textarea { width: 100%; min-height: 100px; padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); resize: vertical; outline: none; }
  .response-textarea:focus { border-color: var(--accent); }
  .code-block { margin: 0; padding: var(--space-3) var(--space-4); background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); overflow-x: auto; }
  .result-display { padding: var(--space-4); }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); font-size: var(--text-sm); }
  .result-display.success { background: var(--success-soft); }
  .result-display.error { background: var(--error-soft); color: var(--error); }
  .result-display pre { margin: 0; font-family: var(--font-mono); font-size: var(--text-sm); }
  .info-section { padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .info-section h3 { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: var(--space-2); }
  .info-section p { color: var(--text-secondary); margin-bottom: var(--space-2); }
  .info-section ol { margin-left: var(--space-4); color: var(--text-secondary); }
  .info-section li { margin-bottom: var(--space-1); }
  @media (max-width: 768px) { .input-row { grid-template-columns: 1fr; } }
</style>
