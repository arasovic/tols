<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import ToolHeader from '$lib/ui/ToolHeader.svelte'
  import ToolShell from '$lib/ui/ToolShell.svelte'
  import PanelGroup from '$lib/ui/PanelGroup.svelte'
  import Panel from '$lib/ui/Panel.svelte'
  import Button from '$lib/ui/Button.svelte'
  import { base } from '$app/paths'
  import { onMount, onDestroy } from 'svelte'
  import { base64UrlEncode, signHS256 as signHMAC } from 'tols-cli/core/jwt'

  const EXAMPLE_PAYLOAD = JSON.stringify({
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
    exp: 1767225600
  }, null, 2)

  const DEFAULT_HEADER = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)

  let header = DEFAULT_HEADER
  let payload = EXAMPLE_PAYLOAD
  let secret = 'your-256-bit-secret'
  let token = ''
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let showSecret = false
  let mounted = false

  /**
   * A placeholder for the secret, not the secret. The CLI genuinely requires
   * `--secret=<value>`, so the flag has to appear — but its value is the one
   * thing on this page the tool deliberately hides: the input is a password
   * field behind a reveal toggle. Interpolating the live secret would unmask it
   * permanently, in plain text, next to a copy button. `@payload.json` is
   * already this product's idiom for "this does not belong inline"; the secret
   * is the same case for a stronger reason. The header is not sensitive and is
   * shown as it is.
   */
  $: cliFlags = { secret: '<secret>', header }

  function loadState() {
    try {
      const savedHeader = localStorage.getItem('devutils-jwt-encoder-header')
      const savedPayload = localStorage.getItem('devutils-jwt-encoder-payload')
      const savedSecret = localStorage.getItem('devutils-jwt-encoder-secret')
      if (savedHeader) header = savedHeader
      if (savedPayload) payload = savedPayload
      if (savedSecret) secret = savedSecret
    } catch (/** @type {any} */ e) {
      console.error('Failed to load state:', e)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-jwt-encoder-header', header)
        localStorage.setItem('devutils-jwt-encoder-payload', payload)
        localStorage.setItem('devutils-jwt-encoder-secret', secret)
      } catch (/** @type {any} */ e) {
        console.error('Failed to save state:', e)
      }
    }, 500)
  }

  onMount(() => {
    loadState()
    mounted = true
    requestAnimationFrame(() => {
      if (payload?.trim() && secret?.trim()) {
        generateToken()
      }
    })
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  async function generateToken() {
    error = ''
    token = ''

    if (!secret.trim()) {
      error = 'Please enter a secret'
      saveState()
      return
    }

    const trimmedHeader = header.trim()
    if (!trimmedHeader) {
      error = 'Please enter a header'
      saveState()
      return
    }

    try {
      JSON.parse(trimmedHeader)
    } catch (/** @type {any} */ e) {
      error = `Invalid header JSON: ${e.message}`
      saveState()
      return
    }

    const trimmedPayload = payload.trim()
    if (!trimmedPayload) {
      error = 'Please enter a payload'
      saveState()
      return
    }

    try {
      JSON.parse(trimmedPayload)
    } catch (/** @type {any} */ e) {
      error = `Invalid payload JSON: ${e.message}`
      saveState()
      return
    }

    try {
      const encodedHeader = base64UrlEncode(trimmedHeader)
      const encodedPayload = base64UrlEncode(trimmedPayload)
      const message = `${encodedHeader}.${encodedPayload}`
      const signature = await signHMAC(message, secret)
      token = `${message}.${signature}`
      saveState()
    } catch (/** @type {any} */ e) {
      error = `Error generating token: ${e.message}`
      saveState()
    }
  }

  function debouncedGenerate() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      generateToken()
    }, 300)
  }

  function clear() {
    header = DEFAULT_HEADER
    payload = ''
    secret = ''
    token = ''
    error = ''
    try {
      localStorage.removeItem('devutils-jwt-encoder-header')
      localStorage.removeItem('devutils-jwt-encoder-payload')
      localStorage.removeItem('devutils-jwt-encoder-secret')
    } catch (/** @type {any} */ e) {
      console.error('Failed to clear state:', e)
    }
  }

  function loadExample() {
    header = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)
    payload = EXAMPLE_PAYLOAD
    secret = 'your-256-bit-secret'
    generateToken()
  }

  function toggleSecretVisibility() {
    showSecret = !showSecret
  }
</script>

<div class="tool">
  <ToolHeader toolId="jwt-encoder">
    <svelte:fragment slot="actions">
      <a class="tool-crosslink" href="{base}/jwt">Need to decode a token? JWT Decoder →</a>
    </svelte:fragment>
  </ToolHeader>

  <ToolShell
    toolId="jwt-encoder"
    action="enc"
    flags={cliFlags}
    input={payload}
    output={token}
    onRun={generateToken}
  >
    <PanelGroup columns={1}>
      <Panel label="Header (JSON)">
        <textarea bind:value={header} on:input={debouncedGenerate} class="input-textarea" spellcheck="false"></textarea>
      </Panel>

      <Panel label="Payload (JSON)">
        <textarea bind:value={payload} on:input={debouncedGenerate} class="input-textarea" spellcheck="false"></textarea>
      </Panel>
    </PanelGroup>

    <div class="secret-card">
      <span class="secret-label">Secret Key</span>
      <div class="secret-input-wrapper">
        {#if showSecret}
          <input type="text" bind:value={secret} on:input={debouncedGenerate} class="secret-input" placeholder="Enter secret key..." />
        {:else}
          <input type="password" bind:value={secret} on:input={debouncedGenerate} class="secret-input" placeholder="Enter secret key..." />
        {/if}
        <button class="secret-toggle" on:click={toggleSecretVisibility} aria-label={showSecret ? 'Hide secret' : 'Show secret'} type="button">
          {#if showSecret}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          {:else}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          {/if}
        </button>
      </div>
    </div>

    {#if error}
      <div class="error-display">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span>{error}</span>
      </div>
    {/if}

    {#if token}
      <!-- columns={1}: a JWT is one long unbroken string that would wrap badly
           in half a width. -->
      <PanelGroup columns={1}>
        <Panel label="Generated JWT Token" data-testid="jwt-token-panel">
          <pre class="token-value">{token}</pre>
        </Panel>
      </PanelGroup>
    {/if}

    <svelte:fragment slot="rail">
      <Button on:click={loadExample} aria-label="Load example">example</Button>
      <Button on:click={clear} aria-label="Clear">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      {#if token}<CopyButton text={token} />{/if}
    </svelte:fragment>
  </ToolShell>
</div>

<style>
  .tool { display: flex; flex-direction: column; gap: 0; width: 100%; }
  .tool-crosslink { font-size: var(--text-xs); color: var(--accent); text-decoration: none; margin-top: var(--space-1); }
  .tool-crosslink:hover { text-decoration: underline; }
  .input-textarea { width: 100%; min-height: 100px; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); resize: vertical; outline: none; }
  .secret-card { padding: var(--space-3); background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); }
  .secret-label { display: block; margin-bottom: var(--space-2); font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .secret-input-wrapper { display: flex; align-items: center; position: relative; }
  .secret-input { width: 100%; padding: var(--space-3); padding-right: 40px; border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); outline: none; }
  .secret-toggle { position: absolute; right: var(--space-2); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--radius); background: transparent; color: var(--text-tertiary); border: none; cursor: pointer; transition: all var(--transition-fast) var(--ease-out); }
  .secret-toggle:hover { color: var(--text-primary); }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .token-value { margin: 0; padding: var(--space-4); background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-relaxed); word-break: break-all; white-space: pre-wrap; }
</style>