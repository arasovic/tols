<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount, onDestroy } from 'svelte'

  const DEBOUNCE_MS = 150
  const SAVE_DEBOUNCE_MS = 500

  function getExampleTimestamp() {
    return Math.floor(Date.now() / 1000).toString()
  }

  let input = ''
  let output = ''
  let mode = 'toHuman'
  let fromTimezone = 'UTC'
  let error = ''
  let timeout
  let saveTimeout
  let stateLoaded = false

  const timezones = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Local', label: 'Local Time' },
    { value: 'America/New_York', label: 'New York (EST/EDT)' },
    { value: 'Europe/London', label: 'London (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
    { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
    { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' }
  ]

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-timestamp-input')
      const savedMode = localStorage.getItem('devutils-timestamp-mode')
      const savedTimezone = localStorage.getItem('devutils-timestamp-timezone')
      if (savedInput) {
        input = savedInput
      } else {
        input = getExampleTimestamp()
      }
      if (savedMode) mode = savedMode
      if (savedTimezone && timezones.find(tz => tz.value === savedTimezone)) {
        fromTimezone = savedTimezone
      }
      stateLoaded = true
    } catch (e) {
      input = getExampleTimestamp()
      stateLoaded = true
      console.warn('Failed to load from localStorage:', e)
    }
  }

  function saveState() {
    clearTimeout(saveTimeout)
    saveTimeout = setTimeout(() => {
      try {
        localStorage.setItem('devutils-timestamp-input', input)
        localStorage.setItem('devutils-timestamp-mode', mode)
        localStorage.setItem('devutils-timestamp-timezone', fromTimezone)
      } catch (e) {
        console.warn('Failed to save to localStorage:', e)
      }
    }, SAVE_DEBOUNCE_MS)
  }

  onMount(() => {
    loadState()
    if (stateLoaded && input) process()
  })

  onDestroy(() => {
    clearTimeout(timeout)
    clearTimeout(saveTimeout)
  })

  function formatDate(date, tz) {
    if (tz === 'Local') {
      return date.toLocaleString()
    }
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).format(date)
    } catch (e) {
      return date.toISOString() + ' (UTC - timezone error)'
    }
  }

  function process() {
    error = ''
    output = ''

    if (!input || !input.trim()) {
      error = ''
      return
    }

    const trimmedInput = input.trim()

    try {
      if (mode === 'toHuman') {
        let timestamp
        // Allow optional minus sign for negative timestamps
        const isAllDigits = /^-?\d+$/.test(trimmedInput)
        const isReasonableLength = trimmedInput.length >= 1 && trimmedInput.length <= 16

        if (isAllDigits && isReasonableLength) {
          timestamp = parseInt(trimmedInput, 10)
          // Detect milliseconds: values between 1e10 and 1e16 are likely milliseconds
          // Unix seconds are ~1.7e9 (2024), so anything > 1e10 is definitely milliseconds
          const isMilliseconds = timestamp > 1e10 && timestamp < 1e16
          if (isMilliseconds) {
            timestamp = timestamp / 1000
          }
        } else {
          const parsedDate = new Date(trimmedInput)
          if (!isNaN(parsedDate.getTime())) {
            timestamp = parsedDate.getTime() / 1000
          } else {
            timestamp = NaN
          }
        }

        if (isNaN(timestamp) || !isFinite(timestamp)) {
          error = 'Invalid timestamp format'
          return
        }

        const date = new Date(timestamp * 1000)
        if (isNaN(date.getTime())) {
          error = 'Invalid date from timestamp'
          return
        }
        
        const formatted = formatDate(date, fromTimezone)
        const iso = date.toISOString()
        const relative = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        
        output = JSON.stringify({
          formatted,
          iso,
          relative,
          utc: date.toUTCString()
        }, null, 2)
      } else {
        const date = new Date(trimmedInput)
        if (isNaN(date.getTime())) {
          error = 'Invalid date format'
          return
        }
        const unix = Math.floor(date.getTime() / 1000)
        const unixMs = date.getTime()
        
        output = JSON.stringify({
          unix,
          unixMs,
          iso: date.toISOString()
        }, null, 2)
      }
    } catch (e) {
      error = 'Conversion failed: ' + e.message
    }
  }

  function debouncedProcess() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      process()
      saveState()
    }, DEBOUNCE_MS)
  }

  function clear() {
    clearTimeout(saveTimeout)
    input = ''
    output = ''
    error = ''
    try {
      localStorage.removeItem('devutils-timestamp-input')
      localStorage.removeItem('devutils-timestamp-mode')
      localStorage.removeItem('devutils-timestamp-timezone')
    } catch (e) {
      console.warn('Failed to clear localStorage:', e)
    }
  }

  function loadExample() {
    input = getExampleTimestamp()
    process()
    saveState()
  }

  function now() {
    const nowTs = Math.floor(Date.now() / 1000)
    input = nowTs.toString()
    process()
    saveState()
  }

  function setMode(newMode) {
    mode = newMode
    input = ''
    output = ''
    error = ''
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-bar">
    <div class="tool-title">
      <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <h1 class="tool-title-text">Timestamp Converter</h1>
    </div>
    
    <div class="tool-actions">
      <button class="btn-ghost" on:click={loadExample} title="Load Example" aria-label="Load Example">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M12 6v6l4 2"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </button>
      <button class="btn-ghost" on:click={clear} title="Clear" aria-label="Clear">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  </div>

  <div class="controls-card">
    <div class="mode-selector">
      <button 
        class="mode-btn" 
        class:active={mode === 'toHuman'}
        on:click={() => setMode('toHuman')}
        aria-pressed={mode === 'toHuman'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Unix → Human
      </button>
      <button 
        class="mode-btn" 
        class:active={mode === 'toUnix'}
        on:click={() => setMode('toUnix')}
        aria-pressed={mode === 'toUnix'}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
          <polyline points="17 1 21 5 17 9"></polyline>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
          <polyline points="7 23 3 19 7 15"></polyline>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        </svg>
        Human → Unix
      </button>
    </div>
  </div>

  {#if mode === 'toHuman'}
    <div class="timezone-card">
      <div class="timezone-header">
        <span class="control-label">Output Timezone</span>
      </div>
      <div class="timezone-grid">
        {#each timezones as tz}
          <button 
            class="tz-btn" 
            class:active={fromTimezone === tz.value}
            on:click={() => { fromTimezone = tz.value; process(); }}
            aria-pressed={fromTimezone === tz.value}
          >
            {tz.label}
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <div class="panel">
    <div class="panel-header">
      <span class="panel-title">{mode === 'toHuman' ? 'Unix Timestamp' : 'Date & Time'}</span>
      <div class="header-actions">
        {#if mode === 'toHuman'}
          <button class="btn-now" on:click={now}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Now
          </button>
        {/if}
      </div>
    </div>
    <input
      id="timestamp-input"
      type="text"
      bind:value={input}
      on:input={debouncedProcess}
      on:keydown={(e) => e.key === 'Enter' && process()}
      placeholder={mode === 'toHuman' ? 'Enter Unix timestamp (e.g., 1704067200)...' : 'Enter date (e.g., 2024-01-01 00:00:00)...'}
      class="input-field mono"
      aria-describedby="timestamp-error"
    />
  </div>

  {#if error}
    <div id="timestamp-error" class="error-state" role="alert" aria-live="polite">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{error}</span>
    </div>
  {:else if output}
    <div class="panel output-panel">
      <div class="panel-header">
        <span class="panel-title">Converted</span>
        <div class="header-actions">
          <CopyButton text={output} />
        </div>
      </div>
      <div class="output-content">
        <pre><code>{output}</code></pre>
      </div>
    </div>

    <div class="info-bar">
      <div class="info-item">
        <span class="info-label">Mode:</span>
        <span class="badge badge-accent">{mode === 'toHuman' ? 'Unix → Human' : 'Human → Unix'}</span>
      </div>
      {#if mode === 'toHuman' && fromTimezone !== 'Local'}
        <div class="info-item">
          <span class="info-label">Timezone:</span>
          <span class="info-value">{fromTimezone}</span>
        </div>
      {/if}
    </div>
  {:else}
    <div class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>Enter a timestamp or date to convert</span>
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

  .controls-card {
    display: flex;
    justify-content: center;
    padding: var(--space-3);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .mode-selector {
    display: flex;
    background: var(--bg-elevated);
    padding: var(--space-1);
    border-radius: var(--radius);
    border: 1px solid var(--border-subtle);
  }

  .mode-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: all var(--transition);
    white-space: nowrap;
  }

  .mode-btn:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .mode-btn.active {
    background: var(--accent);
    color: white;
    box-shadow: var(--shadow-accent-sm);
  }

  .timezone-card {
    padding: var(--space-3);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .timezone-header {
    margin-bottom: var(--space-3);
  }

  .control-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .timezone-grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .tz-btn {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-size: var(--text-xs);
    border: 1px solid var(--border-subtle);
    transition: all var(--transition);
  }

  .tz-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-default);
  }

  .tz-btn.active {
    background: var(--accent-muted);
    color: var(--accent);
    border-color: var(--accent-muted);
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
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }

  .btn-now {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--accent-muted);
    color: var(--accent);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    transition: all var(--transition);
  }

  .btn-now:hover {
    background: var(--accent);
    color: white;
  }

  .input-field {
    padding: var(--space-3);
    border: none;
    background: var(--bg-surface);
    color: var(--text-primary);
    font-size: var(--text-sm);
  }

  .input-field:focus {
    outline: none;
  }

  .input-field::placeholder {
    color: var(--text-disabled);
  }

  .output-panel {
    background: var(--bg-base);
  }

  .output-content {
    padding: var(--space-4);
    overflow-x: auto;
    max-height: 250px;
    overflow-y: auto;
  }

  .output-content pre {
    margin: 0;
    padding: 0;
    background: transparent;
    border: none;
  }

  .output-content code {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-primary);
    line-height: 1.8;
    white-space: pre;
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
    .tool-bar {
      flex-direction: column;
      gap: var(--space-3);
      align-items: flex-start;
    }

    .tool-actions {
      width: 100%;
      justify-content: flex-end;
    }

    .mode-selector {
      flex-direction: column;
      width: 100%;
    }

    .mode-btn {
      justify-content: center;
    }

    .info-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>