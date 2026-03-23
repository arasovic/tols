<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_PAYLOAD = JSON.stringify({
    sub: "1234567890",
    name: "John Doe",
    iat: 1516239022,
    exp: 1735689600
  }, null, 2)

  let header = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)
  let payload = EXAMPLE_PAYLOAD
  let secret = 'your-256-bit-secret'
  let token = ''
  let error = ''
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedHeader = localStorage.getItem('devutils-jwt-encoder-header')
      const savedPayload = localStorage.getItem('devutils-jwt-encoder-payload')
      const savedSecret = localStorage.getItem('devutils-jwt-encoder-secret')
      if (savedHeader) header = savedHeader
      if (savedPayload) payload = savedPayload
      if (savedSecret) secret = savedSecret
    } catch (e) {}
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-jwt-encoder-header', header)
        localStorage.setItem('devutils-jwt-encoder-payload', payload)
        localStorage.setItem('devutils-jwt-encoder-secret', secret)
      }, 500)
    } catch (e) {}
  }

  onMount(() => {
    loadState()
    if (payload && secret) generateToken()
  })

  async function base64UrlEncode(str) {
    const encoder = new TextEncoder()
    const data = encoder.encode(str)
    const base64 = btoa(String.fromCharCode(...new Uint8Array(data)))
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  async function signHMAC(message, key) {
    const encoder = new TextEncoder()
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
    const base64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  async function generateToken() {
    error = ''
    token = ''

    if (!secret.trim()) {
      error = 'Please enter a secret'
      return
    }

    try {
      JSON.parse(header)
    } catch (e) {
      error = 'Invalid header JSON'
      return
    }

    try {
      JSON.parse(payload)
    } catch (e) {
      error = 'Invalid payload JSON'
      return
    }

    try {
      const encodedHeader = await base64UrlEncode(header)
      const encodedPayload = await base64UrlEncode(payload)
      const message = `${encodedHeader}.${encodedPayload}`
      const signature = await signHMAC(message, secret)
      token = `${message}.${signature}`
    } catch (e) {
      error = 'Error generating token'
    }
  }

  function debouncedGenerate() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      generateToken()
      saveState()
    }, 300)
  }

  function clear() {
    header = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)
    payload = ''
    secret = ''
    token = ''
    error = ''
    try {
      localStorage.removeItem('devutils-jwt-encoder-header')
      localStorage.removeItem('devutils-jwt-encoder-payload')
      localStorage.removeItem('devutils-jwt-encoder-secret')
    } catch (e) {}
  }

  function loadExample() {
    header = JSON.stringify({ alg: "HS256", typ: "JWT" }, null, 2)
    payload = EXAMPLE_PAYLOAD
    secret = 'your-256-bit-secret'
    generateToken()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-header">
    <div class="tool-meta">
      <h1 class="tool-name">JWT Encoder</h1>
      <p class="tool-desc">Create and sign JWT tokens with HS256</p>
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
      <input type="text" bind:value={secret} on:input={debouncedGenerate} class="secret-input" placeholder="Enter secret key..." />
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
  .secret-input { width: 100%; padding: var(--space-3); border: none; background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); outline: none; }
  .error-display { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: var(--error-soft); color: var(--error-text); border-radius: var(--radius-md); }
  .token-output { background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden; }
  .token-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-3) var(--space-4); background: var(--bg-elevated); border-bottom: 1px solid var(--border-subtle); font-size: var(--text-xs); font-weight: var(--font-semibold); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--text-tertiary); }
  .token-value { margin: 0; padding: var(--space-4); background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-relaxed); word-break: break-all; white-space: pre-wrap; }
  @media (max-width: 768px) { .tool-header { flex-direction: column; align-items: flex-start; } .tool-actions { width: 100%; justify-content: flex-end; } }
</style>
