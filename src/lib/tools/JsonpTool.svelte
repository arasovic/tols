<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_URL = 'https://api.example.com/data'
  const EXAMPLE_CALLBACK = 'myCallback'

  let url = EXAMPLE_URL
  let callback = EXAMPLE_CALLBACK
  let response = '{"name": "John", "age": 30}'
  let generatedScript = ''
  let parsedResult = null
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedUrl = localStorage.getItem('devutils-jsonp-url')
      const savedCallback = localStorage.getItem('devutils-jsonp-callback')
      const savedResponse = localStorage.getItem('devutils-jsonp-response')
      if (savedUrl) url = savedUrl
      if (savedCallback) callback = savedCallback
      if (savedResponse) response = savedResponse
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-jsonp-url', url)
        localStorage.setItem('devutils-jsonp-callback', callback)
        localStorage.setItem('devutils-jsonp-response', response)
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
    generateScript()
  })

  function generateScript() {
    generatedScript = `<script src="${url}?callback=${callback}"><\/script>`
    
    try {
      const data = JSON.parse(response)
      parsedResult = {
        status: 'success',
        data: data
      }
    } catch (e) {
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
    }, 300)
  }

  function clear() {
    url = ''
    callback = ''
    response = ''
    generatedScript = ''
    parsedResult = null
    try {
      localStorage.removeItem('devutils-jsonp-url')
      localStorage.removeItem('devutils-jsonp-callback')
      localStorage.removeItem('devutils-jsonp-response')
    } catch (e) {}
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
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">JSONP Tester</h1>
      <p class="tool-desc">Simulate JSONP requests and parse responses</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={loadExample} title="Load Example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="jsonp-inputs">
    <div class="input-row">
      <div class="input-group">
        <label>URL</label>
        <input type="text" bind:value={url} on:input={debouncedGenerate} placeholder="https://api.example.com/data" />
      </div>
      <div class="input-group callback-group">
        <label>Callback Function</label>
        <input type="text" bind:value={callback} on:input={debouncedGenerate} placeholder="myCallback" />
      </div>
    </div>

    <div class="input-group">
      <label>Simulated Response (JSON)</label>
      <textarea bind:value={response} on:input={debouncedGenerate} placeholder='{{"key": "value"}}' class="response-textarea"></textarea>
    </div>
  </div>

  {#if generatedScript}
    <div class="output-section">
      <div class="output-header">
        <span>Generated Script Tag</span>
        <CopyButton text={generatedScript} />
      </div>
      <pre class="code-block">{generatedScript}</pre>
    </div>
  {/if}

  {#if parsedResult}
    <div class="output-section">
      <div class="output-header">
        <span>Parsed Result</span>
      </div>
      <div class="result-display" class:success={parsedResult.status === 'success'} class:error={parsedResult.status === 'error'}>
        {#if parsedResult.status === 'success'}
          <pre>{JSON.stringify(parsedResult.data, null, 2)}</pre>
        {:else}
          <span>{parsedResult.error}</span>
        {/if}
      </div>
    </div>
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
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: var(--space-5); width: 100%; animation: fadeIn var(--transition) var(--ease-out); }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .tool-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-4); border-bottom: 1px solid var(--border-subtle); }
  .tool-meta { display: flex; flex-direction: column; gap: var(--space-1); }
  .tool-name { font-size: var(--text-xl); font-weight: var(--font-semibold); color: var(--text-primary); letter-spacing: var(--tracking-tight); margin: 0; }
  .tool-desc { font-size: var(--text-sm); color: var(--text-tertiary); margin: 0; }
  .tool-actions { display: flex; align-items: center; gap: var(--space-2); }
  .icon-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: var(--radius); background: transparent; color: var(--text-tertiary); border: none; cursor: pointer; transition: all var(--transition-fast); }
  .icon-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
  .jsonp-inputs { display: flex; flex-direction: column; gap: var(--space-4); padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .input-row { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-4); }
  .input-group { display: flex; flex-direction: column; gap: var(--space-1); }
  .input-group label { font-size: var(--text-xs); font-weight: var(--font-medium); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .input-group input { padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-size: var(--text-base); outline: none; }
  .input-group input:focus { border-color: var(--accent); box-shadow: var(--glow-focus); }
  .response-textarea { width: 100%; min-height: 100px; padding: var(--space-3); border: 1px solid var(--border-default); border-radius: var(--radius); background: var(--bg-base); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); resize: vertical; outline: none; }
  .response-textarea:focus { border-color: var(--accent); }
  .output-section { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .output-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .code-block { margin: 0; padding: var(--space-3) var(--space-4); background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); overflow-x: auto; }
  .result-display { padding: var(--space-4); }
  .result-display.success { background: rgba(34, 197, 94, 0.1); }
  .result-display.error { background: rgba(239, 68, 68, 0.1); color: var(--error); }
  .result-display pre { margin: 0; font-family: var(--font-mono); font-size: var(--text-sm); }
  .info-section { padding: var(--space-4); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .info-section h3 { font-size: var(--text-base); font-weight: var(--font-semibold); color: var(--text-primary); margin-bottom: var(--space-2); }
  .info-section p { color: var(--text-secondary); margin-bottom: var(--space-2); }
  .info-section ol { margin-left: var(--space-4); color: var(--text-secondary); }
  .info-section li { margin-bottom: var(--space-1); }
  @media (max-width: 768px) { .input-row { grid-template-columns: 1fr; } .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
