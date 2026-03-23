<script>
  import CopyButton from '$lib/components/CopyButton.svelte'
  import { onMount } from 'svelte'

  const EXAMPLE_REGEX = '\\d+'
  const EXAMPLE_TEXT = 'There are 42 apples and 123 oranges'

  let input = ''
  let pattern = ''
  let flags = 'g'
  let matches = []
  let error = ''
  let errorDetails = ''
  let highlightedInput = ''
  let timeout = null
  let saveTimeout = null

  const flagOptions = [
    { value: 'g', label: 'Global', desc: 'Find all matches' },
    { value: 'i', label: 'Case Insensitive', desc: 'Ignore case' },
    { value: 'm', label: 'Multiline', desc: '^$ match line start/end' },
    { value: 's', label: 'Dotall', desc: '. matches newlines' },
    { value: 'u', label: 'Unicode', desc: 'Enable unicode' }
  ]

  function loadState() {
    try {
      const savedInput = localStorage.getItem('devutils-regex-input')
      const savedPattern = localStorage.getItem('devutils-regex-pattern')
      const savedFlags = localStorage.getItem('devutils-regex-flags')
      if (savedInput) {
        input = savedInput
      } else {
        input = EXAMPLE_TEXT
      }
      if (savedPattern) {
        pattern = savedPattern
      } else {
        pattern = EXAMPLE_REGEX
      }
      if (savedFlags) flags = savedFlags
    } catch (e) {
      input = EXAMPLE_TEXT
      pattern = EXAMPLE_REGEX
      error = 'Failed to load from localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function saveState() {
    try {
      if (saveTimeout) clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        localStorage.setItem('devutils-regex-input', input)
        localStorage.setItem('devutils-regex-pattern', pattern)
        localStorage.setItem('devutils-regex-flags', flags)
      }, 500)
    } catch (e) {
      error = 'Failed to save to localStorage: ' + (e.message || 'Unknown error')
    }
  }

  onMount(() => {
    loadState()
    performMatch()
  })

  function escapeHtml(text) {
    if (!text) return ''
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  function performMatch() {
    error = ''
    errorDetails = ''
    matches = []
    highlightedInput = ''

    if (!pattern.trim()) {
      return
    }

    if (!input) {
      return
    }

    try {
      const regex = new RegExp(pattern, flags)

      if (!regex.global) {
        const match = input.match(regex)
        if (match) {
          matches = [match]
        }
      } else {
        matches = Array.from(input.matchAll(regex))
      }

      let highlighted = ''
      let lastIndex = 0

      matches.forEach(match => {
        const start = match.index
        const end = start + match[0].length
        highlighted += escapeHtml(input.substring(lastIndex, start))
        highlighted += '<mark class="match-highlight">' + escapeHtml(match[0]) + '</mark>'
        lastIndex = end
      })

      highlighted += escapeHtml(input.substring(lastIndex))

      highlightedInput = highlighted
    } catch (e) {
      error = 'Invalid regex pattern'
      errorDetails = e.message || 'Unknown error'
    }
  }

  function debouncedMatch() {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      performMatch()
      saveState()
    }, 150)
  }

  function clear() {
    input = ''
    pattern = ''
    matches = []
    highlightedInput = ''
    error = ''
    errorDetails = ''
    try {
      localStorage.removeItem('devutils-regex-input')
      localStorage.removeItem('devutils-regex-pattern')
      localStorage.removeItem('devutils-regex-flags')
    } catch (e) {
      error = 'Failed to clear localStorage: ' + (e.message || 'Unknown error')
    }
  }

  function loadExample() {
    input = EXAMPLE_TEXT
    pattern = EXAMPLE_REGEX
    performMatch()
    saveState()
  }

  function toggleFlag(flag) {
    if (flags.includes(flag)) {
      flags = flags.replace(flag, '')
    } else {
      flags += flag
    }
    performMatch()
    saveState()
  }
</script>

<div class="tool">
  <div class="tool-bar">
    <div class="tool-title">
      <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
        <path d="m15 5 4 4"></path>
      </svg>
      <h1 class="tool-title-text">Regex Tester</h1>
    </div>
    
    <div class="tool-actions">
      <button class="btn-ghost" on:click={loadExample} title="Load Example">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2" fill="none"/>
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

  <div class="pattern-card">
    <div class="pattern-input-group">
      <span class="delimiter">/</span>
      <input
        type="text"
        bind:value={pattern}
        on:input={debouncedMatch}
        placeholder="Enter regex pattern..."
        class="pattern-input mono"
        spellcheck="false"
      />
      <span class="delimiter">/</span>
      <span class="flags-display mono">{flags}</span>
    </div>
    <div class="flags-row">
      {#each flagOptions as flag}
        <button 
          class="flag-btn"
          class:active={flags.includes(flag.value)}
          on:click={() => toggleFlag(flag.value)}
          title="{flag.label}: {flag.desc}"
        >
          {flag.value}
        </button>
      {/each}
    </div>
  </div>

  {#if error}
    <div class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <div class="error-content">
        <span class="error-title">{error}</span>
        {#if errorDetails}
          <span class="error-details">{errorDetails}</span>
        {/if}
      </div>
    </div>
  {/if}

  <div class="panels-grid">
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Test String</span>
        <span class="panel-badge">{input.length} chars</span>
      </div>
      <textarea
        bind:value={input}
        on:input={debouncedMatch}
        placeholder="Enter text to test against the regex..."
        class="input-area"
        spellcheck="false"
      ></textarea>
    </div>

    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">
          Matches 
          {#if matches.length > 0}
            <span class="match-count">{matches.length}</span>
          {/if}
        </span>
        <div class="header-actions">
          {#if matches.length > 0}
            <CopyButton text={matches.map(m => m[0]).join('\n')} />
          {/if}
        </div>
      </div>
      {#if highlightedInput}
        <div class="highlighted-area">{@html highlightedInput}</div>
      {:else}
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
            <path d="m15 5 4 4"></path>
          </svg>
          <span>Matches will appear here</span>
        </div>
      {/if}
    </div>
  </div>

  {#if matches.length > 0}
    <div class="matches-list-card">
      <div class="panel-header">
        <span class="panel-title">Match Details</span>
        <span class="badge badge-accent">{matches.length} matches</span>
      </div>
      <div class="matches-list">
        {#each matches as match, i}
          <div class="match-item" style="animation-delay: {i * 30}ms">
            <span class="match-index">{i + 1}</span>
            <div class="match-content">
              <code class="match-text">{match[0]}</code>
              {#if match.length > 1}
                <div class="match-groups">
                  {#each match.slice(1) as group, gi}
                    <span class="group-item">
                      <span class="group-label">Group {gi + 1}:</span>
                      <code class="group-value">{group || '(empty)'}</code>
                    </span>
                  {/each}
                </div>
              {/if}
            </div>
            <span class="match-position">@{match.index}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <div class="info-bar">
    <div class="info-item">
      <span class="info-label">Flags:</span>
      <span class="info-value mono">{flags || '(none)'}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Pattern:</span>
      <span class="info-value mono">{pattern || '(empty)'}</span>
    </div>
  </div>
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

  .pattern-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
  }

  .pattern-input-group {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    background: var(--bg-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
  }

  .delimiter {
    font-family: var(--font-mono);
    color: var(--accent);
    font-weight: var(--font-bold);
    font-size: var(--text-lg);
  }

  .pattern-input {
    flex: 1;
    padding: var(--space-1);
    border: none;
    background: transparent;
    color: var(--text-primary);
    font-size: var(--text-base);
  }

  .pattern-input:focus {
    outline: none;
  }

  .pattern-input::placeholder {
    color: var(--text-disabled);
  }

  .flags-display {
    color: var(--accent-secondary);
    font-size: var(--text-sm);
    min-width: 30px;
  }

  .flags-row {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .flag-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius);
    background: var(--bg-elevated);
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-weight: var(--font-semibold);
    font-size: var(--text-sm);
    border: 1px solid var(--border-subtle);
    transition: all var(--transition);
  }

  .flag-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
    border-color: var(--border-default);
  }

  .flag-btn.active {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
    box-shadow: var(--shadow-accent-sm);
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

  .error-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .error-title {
    font-weight: var(--font-semibold);
  }

  .error-details {
    color: var(--error-muted);
    font-size: var(--text-xs);
  }

  .panels-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
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

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
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

  .match-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    background: var(--accent);
    color: white;
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    border-radius: var(--radius-full);
  }

  .panel-badge {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    padding: 2px 6px;
    background: var(--bg-surface);
    border-radius: var(--radius-sm);
    margin-left: auto;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-left: auto;
  }

  .input-area {
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

  .highlighted-area {
    min-height: 280px;
    padding: var(--space-3);
    background: var(--bg-base);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: 1.6;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-y: auto;
    max-height: 280px;
    color: var(--text-primary);
  }

  .highlighted-area :global(.match-highlight) {
    background: var(--accent-muted);
    color: var(--accent);
    padding: 1px 2px;
    border-radius: 2px;
  }

  .empty-state {
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

  .matches-list-card {
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .matches-list {
    max-height: 250px;
    overflow-y: auto;
    background: var(--bg-base);
  }

  .match-item {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-3);
    border-bottom: 1px solid var(--border-subtle);
    transition: background var(--transition);
    animation: fadeInUp var(--transition-normal) ease backwards;
  }

  .match-item:last-child {
    border-bottom: none;
  }

  .match-item:hover {
    background: var(--bg-hover);
  }

  @keyframes fadeInUp {
    from { 
      opacity: 0; 
      transform: translateY(8px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  .match-index {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: var(--bg-elevated);
    color: var(--text-tertiary);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    border-radius: var(--radius-full);
    flex-shrink: 0;
  }

  .match-content {
    flex: 1;
    min-width: 0;
  }

  .match-text {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--accent);
    word-break: break-all;
  }

  .match-groups {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }

  .group-item {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
  }

  .group-label {
    color: var(--text-tertiary);
  }

  .group-value {
    font-family: var(--font-mono);
    color: var(--text-secondary);
    background: var(--bg-elevated);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .match-position {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    border-radius: var(--radius-sm);
  }

  .badge-accent {
    background: var(--accent-muted);
    color: var(--accent);
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

  .mono {
    font-family: var(--font-mono);
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

    .panels-grid {
      grid-template-columns: 1fr;
    }

    .info-bar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>
