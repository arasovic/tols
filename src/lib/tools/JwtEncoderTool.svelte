<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

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
  let timeout
  let saveTimeout
  let showSecret = false
  let mounted = false

  function loadState() {
    try {
      const savedHeader = localStorage.getItem('devutils-jwt-encoder-header')
      const savedPayload = localStorage.getItem('devutils-jwt-encoder-payload')
      const savedSecret = localStorage.getItem('devutils-jwt-encoder-secret')
      if (savedHeader) header = savedHeader
      if (savedPayload) payload = savedPayload
      if (savedSecret) secret = savedSecret
    } catch (e) {
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
      } catch (e) {
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

  function base64UrlEncode(str) {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    let binary = ''
    const bytes = new Uint8Array(data)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  async function signHMAC(message, key) {
    try {
      const encoder = new TextEncoder()
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encoder.encode(key),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
      let binary = ''
      const bytes = new Uint8Array(signature)
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    } catch (e) {
      throw new Error(`HMAC signing failed: ${e.message}`)
    }
  }

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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
    } catch (e) {
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
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">JWT Encoder</h1>
      <p class="tool-desc">Create and sign JWT tokens with HS256</p>
    </div>
    <div class="tool-actions">
      <button class="icon-btn" on:click={loadExample} title="Load Example" aria-label="Load example">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
      </button>
      <button class="icon-btn" on:click={clear} title="Clear" aria-label="Clear">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  </div>

  <div class="jwt-inputs">
    <div class="input-panel">
      <div class="panel-header">
        <span>Header (JSON)</span>
      </div>
      <textarea bind:value={header} on:input={debouncedGenerate} class="input-textarea" spellcheck="false"></textarea>
    </div>

    <div class="input-panel">
      <div class="panel-header">
        <span>Payload (JSON)</span>
      </div>
      <textarea bind:value={payload} on:input={debouncedGenerate} class="input-textarea" spellcheck="false"></textarea>
    </div>

    <div class="input-panel">
      <div class="panel-header">
        <span>Secret Key</span>
      </div>
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
  </div>

  {#if error}
    <div class="error-display">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>{error}</span>
    </div>
  {/if}

  {#if token}
    <div class="token-output">
      <div class="token-header">
        <span>Generated JWT Token</span>
        <CopyButton text={token} />
      </div>
      <pre class="token-value">{token}</pre>
    </div>
  {/if}
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
  .jwt-inputs { display: flex; flex-direction: column; gap: var(--space-4); }
  .input-panel { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .panel-header { padding: var(--space-2) var(--space-3); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .input-textarea { width: 100%; min-height: 100px; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-snug); resize: vertical; outline: none; }
  .secret-input-wrapper { display: flex; align-items: center; position: relative; }
  .secret-input { width: 100%; padding: var(--space-3); padding-right: 40px; border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); outline: none; }
  .secret-toggle { position: absolute; right: var(--space-2); display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--radius); background: transparent; color: var(--text-tertiary); border: none; cursor: pointer; transition: all var(--transition-fast); }
  .secret-toggle:hover { color: var(--text-primary); }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .token-output { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .token-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .token-value { margin: 0; padding: var(--space-4); background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-relaxed); word-break: break-all; white-space: pre-wrap; }
  @media (max-width: 768px) { .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
