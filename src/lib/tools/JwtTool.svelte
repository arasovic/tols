<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { decodeJWT } from '$lib/utils/crypto.js'
  import { onMount } from 'svelte'

  const EXAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  let token = ''
  let decoded = null
  let error = ''
  let timeout
  let saveTimeout

  function loadState() {
    try {
      const savedToken = localStorage.getItem('devutils-jwt-token')
      if (savedToken) {
        token = savedToken
      } else {
        token = EXAMPLE_JWT
        decode()
      }
    } catch (e) {
      token = EXAMPLE_JWT
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    try {
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-jwt-token', token)
      }, 500)
    } catch (e) {
      console.warn('Failed to save to localStorage:', e)
    }
  }

  onMount(() => {
    loadState()
    if (token) decode()
  })

  function decode() {
    error = ''
    decoded = null

    if (!token.trim()) {
      return
    }

    const result = decodeJWT(token)

    if (result.valid) {
      decoded = result
    } else {
      error = result.error
    }
  }

  function debouncedDecode() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      decode()
      saveState()
    }, 150)
  }

  function clear() {
    token = ''
    decoded = null
    error = ''
    try {
      localStorage.removeItem('devutils-jwt-token')
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    token = EXAMPLE_JWT
    decode()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-bar">
    <div class="tool-title">
      <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <h1 class="tool-title-text">JWT Decoder</h1>
    </div>
    
    <div class="tool-actions">
      <button class="btn-ghost" on:click={loadExample} title="Load Example">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="btn-ghost" on:click={clear} title="Clear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>

  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">JWT Token</span>
      <span class="panel-badge">{token.length} chars</span>
    </div>
    <textarea
      bind:value={token}
      on:input={debouncedDecode}
      placeholder="Paste JWT token here (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
      class="input-area mono"
      spellcheck="false"
    ></textarea>
  </div>

  {#if error}
    <div class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{error}</span>
    </div>
  {/if}

  {#if decoded}
    <div class="decoded-grid">
      <div class="panel header-panel">
        <div class="panel-header">
          <span class="panel-title">
            <span class="part-label">Header</span>
          </span>
          <CopyButton text={JSON.stringify(decoded.header, null, 2)} />
        </div>
        <div class="json-content">
          <pre><code>{JSON.stringify(decoded.header, null, 2)}</code></pre>
        </div>
      </div>

      <div class="panel payload-panel">
        <div class="panel-header">
          <span class="panel-title">
            <span class="part-label">Payload</span>
          </span>
          <CopyButton text={JSON.stringify(decoded.payload, null, 2)} />
        </div>
        <div class="json-content">
          <pre><code>{JSON.stringify(decoded.payload, null, 2)}</code></pre>
        </div>
      </div>

      <div class="panel signature-panel">
        <div class="panel-header">
          <span class="panel-title">
            <span class="part-label">Signature</span>
          </span>
          <span class="badge badge-warning" title="Signature verification requires the secret key and is not performed by this decoder">Not Verified</span>
        </div>
        <div class="signature-content">
          <code class="signature-text">{decoded.signature}</code>
          <p class="signature-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Signature verification requires the secret key. This tool only decodes the payload.
          </p>
        </div>
      </div>
    </div>

    <div class="info-bar">
      <div class="info-item">
        <span class="info-label">Status:</span>
        <span class="badge badge-success">Decoded</span>
      </div>
      {#if decoded.payload?.exp}
        <div class="info-item">
          <span class="info-label">Expires:</span>
          <span class="info-value">{new Date(decoded.payload.exp * 1000).toLocaleString()}</span>
        </div>
      {/if}
      {#if decoded.payload?.iat}
        <div class="info-item">
          <span class="info-label">Issued:</span>
          <span class="info-value">{new Date(decoded.payload.iat * 1000).toLocaleString()}</span>
        </div>
      {/if}
    </div>
  {:else if !error && token}
    <div class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      <span>Enter a valid JWT token to decode</span>
    </div>
  {/if}
</div>

<style>
  .tool {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    width: 100%;
  }

  .tool-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .tool-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .tool-title-text {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    margin: 0;
    color: inherit;
  }

  .tool-icon {
    width: 18px;
    height: 18px;
    color: var(--accent);
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .btn-ghost {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius);
    background: transparent;
    color: var(--text-tertiary);
    transition: all var(--transition);
  }

  .btn-ghost:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .panel {
    display: flex;
    flex-direction: column;
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
    animation: fadeIn var(--transition-normal) ease;
  }

  .panel-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border-subtle);
  }

  .panel-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .part-label {
    font-weight: var(--font-semibold);
    color: var(--accent);
  }

  .panel-badge {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 2px 6px;
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
    margin-left: auto;
  }

  .input-area {
    min-height: 120px;
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

  .error-state {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--error-subtle);
    border: 1px solid var(--error-muted);
    border-radius: var(--radius-md);
    color: var(--error);
    font-size: var(--text-sm);
    animation: fadeIn var(--transition-normal) ease;
  }

  .error-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 1px;
  }

  .decoded-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .signature-panel {
    grid-column: 1 / -1;
  }

  .header-panel .part-label {
    color: var(--accent);
  }

  .payload-panel .part-label {
    color: var(--accent-secondary);
  }

  .json-content {
    padding: var(--space-3);
    background: var(--bg-base);
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
  }

  .json-content pre {
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
  }

  .json-content code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-primary);
    line-height: 1.6;
    white-space: pre;
  }

  .signature-content {
    padding: var(--space-3);
    background: var(--bg-base);
    overflow-x: auto;
  }

  .signature-text {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    word-break: break-all;
    letter-spacing: 0.02em;
  }

  .signature-note {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-subtle);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .signature-note svg {
    flex-shrink: 0;
    color: var(--warning);
  }

  .info-bar {
    display: flex;
    align-items: center;
    gap: var(--space-6);
    padding: var(--space-3) var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    flex-wrap: wrap;
  }

  .info-item {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .info-label {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .info-value {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-8);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  .empty-icon {
    width: 32px;
    height: 32px;
    opacity: 0.5;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    .decoded-grid {
      grid-template-columns: 1fr;
    }

    .tool-bar {
      flex-direction: column;
      gap: var(--space-3);
      align-items: flex-start;
    }

    .tool-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .info-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>