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
  import { decodeJWT } from 'tols-cli/core/jwt'
  import { readShareFragment } from '$lib/utils/share.js'
  import { fileDrop } from '$lib/utils/fileDrop.js'
  import { base } from '$app/paths'
  import { onMount, onDestroy } from 'svelte'

  const EXAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

  /**
   * @typedef {{
   *   valid: boolean,
   *   header?: Record<string, unknown>,
   *   payload?: Record<string, unknown>,
   *   signature?: string,
   *   error?: string,
   *   signatureBase64?: string
   * }} DecodedJwt
   */

  let token = ''
  /** @type {DecodedJwt | null} */
  let decoded = null
  let error = ''
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timeout
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let saveTimeout
  let showStorageWarning = true
  let storageEnabled = true

  // The CLI decodes to header/payload/signature text (packages/tols/src/tools/jwt.js);
  // mirroring that shape feeds both ⌘⇧O and any consumer that reads `output`.
  $: output = decoded
    ? `header:\n${JSON.stringify(decoded.header, null, 2)}\npayload:\n${JSON.stringify(decoded.payload, null, 2)}\nsignature: ${decoded.signatureBase64 ?? decoded.signature}`
    : ''

  /**
   * @param {unknown} timestamp
   */
  function formatDate(timestamp) {
    if (!timestamp || typeof timestamp !== 'number') return 'Invalid date'
    const date = new Date(timestamp * 1000)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleString()
  }

  function loadState() {
    try {
      const savedToken = localStorage.getItem('devutils-jwt-token')
      if (savedToken) {
        token = savedToken
      } else {
        token = EXAMPLE_JWT
      }
    } catch (/** @type {any} */ e) {
      token = EXAMPLE_JWT
      storageEnabled = false
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    if (!storageEnabled) return
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-jwt-token', token)
      } catch (/** @type {any} */ e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, 500)
  }

  function dismissStorageWarning() {
    showStorageWarning = false
  }

  function disableStorage() {
    storageEnabled = false
    showStorageWarning = false
    try {
      localStorage.removeItem('devutils-jwt-token')
    } catch (/** @type {any} */ e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  onMount(async () => {
    // A shared link takes precedence over locally saved state
    const shared = readShareFragment()
    if (shared && typeof shared.token === 'string') {
      token = shared.token
      await decode()
    } else {
      loadState()
      if (token) await decode()
    }
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  async function decode() {
    error = ''
    decoded = null

    if (!token || !token.trim()) {
      return
    }

    try {
      const result = await decodeJWT(token)

      if (result.valid) {
        decoded = result
        // Store the original base64url signature parts for display
        const parts = token.split('.')
        if (parts.length === 3) {
          decoded.signatureBase64 = parts[2]
        }
      } else {
        error = result.error || ''
      }
    } catch (/** @type {any} */ e) {
      error = 'Failed to decode JWT'
    }
  }

  async function debouncedDecode() {
    clearTimeout(timeout)
    timeout = setTimeout(async () => {
      await decode()
      saveState()
    }, 150)
  }

  async function clear() {
    token = ''
    decoded = null
    error = ''
    if (storageEnabled) {
      try {
        localStorage.removeItem('devutils-jwt-token')
      } catch (/** @type {any} */ e) {
        console.warn('Failed to clear localStorage:', e)
      }
    }
  }

  async function loadExample() {
    token = EXAMPLE_JWT
    await decode()
    saveState()
  }
</script>

<div class="tool">
  <ToolHeader toolId="jwt">
    <svelte:fragment slot="actions">
      <a class="tool-crosslink" href="{base}/jwt-encoder">Need to sign a token? JWT Encoder →</a>
    </svelte:fragment>
  </ToolHeader>

  <ToolShell
    toolId="jwt"
    action="dec"
    input={token}
    {output}
    onRun={decode}
  >
    {#if showStorageWarning && storageEnabled}
      <div class="storage-warning" role="note">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span class="warning-text">
          JWT tokens are stored in localStorage for convenience.
          <button type="button" class="warning-action" on:click={disableStorage}>Disable storage</button>
          or
          <button type="button" class="warning-action" on:click={dismissStorageWarning}>dismiss</button>
        </span>
      </div>
    {/if}

    <!-- columns={1}: a JWT is one long unbroken string that would wrap badly in
         half a width, so the token reads top-to-bottom. -->
    <PanelGroup columns={1}>
      <Panel label="JWT Token" meta="{token.length} chars" data-testid="jwt-input-panel">
        <textarea
          bind:value={token}
          on:input={debouncedDecode}
          use:fileDrop={{ onText: (text) => { token = text; decode() } }}
          placeholder="Paste JWT token here (eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
          class="input-area mono"
          spellcheck="false"
          aria-label="JWT token input"
        ></textarea>
      </Panel>
    </PanelGroup>

    {#if error}
      <div class="error-state" role="alert">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{error}</span>
      </div>
    {/if}

    {#if decoded}
      <PanelGroup>
        <Panel label="Header" data-testid="jwt-header-panel">
          <div class="json-content">
            <div class="pane-actions">
              <CopyButton text={JSON.stringify(decoded.header, null, 2)} />
            </div>
            <pre><code>{JSON.stringify(decoded.header, null, 2)}</code></pre>
          </div>
        </Panel>

        <Panel label="Payload" data-testid="jwt-payload-panel">
          <div class="json-content">
            <div class="pane-actions">
              <CopyButton text={JSON.stringify(decoded.payload, null, 2)} />
            </div>
            <pre><code>{JSON.stringify(decoded.payload, null, 2)}</code></pre>
          </div>
        </Panel>
      </PanelGroup>

      <PanelGroup columns={1}>
        <Panel label="Signature" data-testid="jwt-signature-panel">
          <div class="signature-content">
            <span class="sig-status" title="Signature verification requires the secret key and is not performed by this decoder">Not Verified</span>
            <code class="signature-text">{decoded.signatureBase64 || decoded.signature}</code>
            <p class="signature-note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Signature verification requires the secret key. This tool only decodes the payload.
            </p>
          </div>
        </Panel>
      </PanelGroup>

      <FactStrip
        facts={[
          { label: 'Status', value: 'Decoded', presentation: 'success' },
          ...(decoded.payload?.exp
            ? [{ label: 'Expires', value: formatDate(decoded.payload.exp) }]
            : []),
          ...(decoded.payload?.iat
            ? [{ label: 'Issued', value: formatDate(decoded.payload.iat) }]
            : [])
        ]}
      />
    {:else if !error && token}
      <div class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <span>Enter a valid JWT token to decode</span>
      </div>
    {/if}

    <svelte:fragment slot="rail">
      <Button on:click={loadExample} aria-label="Load example JWT token">example</Button>
      <Button on:click={clear} aria-label="Clear JWT token">clear</Button>
    </svelte:fragment>

    <svelte:fragment slot="rail-end">
      <PasteButton on:text={(e) => { token = e.detail.text; decode() }} />
      <ShareButton getState={() => ({ token })} />
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

  .storage-warning {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--warning-subtle);
    border: 1px solid var(--warning-muted);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--warning);
  }

  .warning-icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    margin-top: 2px;
  }

  .warning-text {
    line-height: 1.5;
  }

  .warning-action {
    background: none;
    border: none;
    padding: 0;
    color: var(--warning);
    text-decoration: underline;
    cursor: pointer;
    font-size: inherit;
  }

  .warning-action:hover {
    color: var(--warning-hover);
  }

  .tool-crosslink {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--accent);
    text-decoration: none;
    margin-left: var(--space-3);
  }

  .tool-crosslink:hover {
    text-decoration: underline;
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
  }

  .error-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    margin-top: 1px;
  }

  .json-content {
    display: flex;
    flex-direction: column;
    padding: var(--space-3);
    background: var(--bg-base);
    overflow-x: auto;
    max-height: 300px;
    overflow-y: auto;
  }

  .pane-actions {
    display: flex;
    justify-content: flex-end;
    padding-bottom: var(--space-2);
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

  .sig-status {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    border-radius: var(--radius-sm);
    background: var(--warning-muted);
    color: var(--warning);
    margin-bottom: var(--space-3);
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
</style>