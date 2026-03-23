<script>
  import { goto } from '$app/navigation'
  import { browser } from '$app/environment'
  import { onMount, tick } from 'svelte'
  import { Search, Command, ArrowRight, Clock, X } from 'lucide-svelte'
  import { searchTools, searchToolsFuzzy } from '$lib/config/searchConfig.js'

  let isOpen = false
  let isOpening = false

  /** @type {HTMLInputElement | undefined} */
  let searchInput = undefined
  /** @type {HTMLDivElement | undefined} */
  let resultsContainer = undefined
  /** @type {HTMLDivElement | undefined} */
  let overlayContainer = undefined
  /** @type {string[]} */
  let recentTools = []
  let selectedIndex = 0
  let query = ''
  /** @type {Element | null} */
  let previouslyFocused = null



  const MAX_RECENT = 5
  const STORAGE_KEY = 'devutils_recent_tools'

  $: filteredTools = searchToolsFuzzy(query)
  $: recentToolsData = recentTools
    .map(id => searchTools.find(t => t.id === id))
    .filter(Boolean)
  $: hasResults = filteredTools.length > 0
  $: hasRecent = recentToolsData.length > 0 && !query.trim()

  // Reactive derived value for aria-activedescendant
  $: activeDescendantId = flatResults[selectedIndex] ? `result-${flatResults[selectedIndex].id}` : undefined
  $: groupedResults = query.trim()
    ? [{ label: 'Results', tools: filteredTools }]
    : [
        ...(hasRecent ? [{ label: 'Recent', tools: recentToolsData }] : []),
        { label: 'All Tools', tools: filteredTools }
      ]

  // Flatten for keyboard navigation
  $: flatResults = groupedResults.flatMap(g => g.tools)

  onMount(() => {
    if (browser) {
      loadRecentTools()
    }
  })

  function loadRecentTools() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        recentTools = JSON.parse(stored)
      }
    } catch {
      recentTools = []
    }
  }

  function saveRecentTools() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentTools))
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * @param {string} toolId
   */
  function addToRecent(toolId) {
    recentTools = [toolId, ...recentTools.filter(id => id !== toolId)].slice(0, MAX_RECENT)
    saveRecentTools()
  }

  function openOverlay() {
    if (browser) {
      previouslyFocused = document.activeElement
    }

    isOpen = true
    isOpening = true

    query = ''
    selectedIndex = 0

    tick().then(() => {
      searchInput?.focus()
    })

    setTimeout(() => {
      isOpening = false
    }, 100)
  }

  export function open() {
    openOverlay()
  }

  function closeOverlay() {
    const elementToFocus = previouslyFocused
    isOpen = false
    query = ''
    selectedIndex = 0
    if (browser && elementToFocus instanceof HTMLElement) {
      tick().then(() => {
        elementToFocus.focus()
      })
    }
  }

  /**
   * Trap focus within the modal
   * @param {KeyboardEvent} e
   */
  function handleFocusTrap(e) {
    if (e.key !== 'Tab' || !isOpen) return

    const focusableElements = Array.from(
      overlayContainer?.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      ) || []
    ).filter(el => {
      const htmlEl = el instanceof HTMLElement ? el : null
      return htmlEl && htmlEl.offsetParent !== null
    })

    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault()
        if (lastElement instanceof HTMLElement) lastElement.focus()
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault()
        if (firstElement instanceof HTMLElement) firstElement.focus()
      }
    }
  }

  /**
   * Handle click outside to close
   * @param {MouseEvent} e
   */
  function handleClickOutside(e) {
    if (!isOpen || !overlayContainer || isOpening) return
    const target = e.target
    if (target instanceof Node && !overlayContainer.contains(target)) {
      closeOverlay()
    }
  }

  /**
   * @param {any} tool
   */
  function selectTool(tool) {
    if (!tool) return
    addToRecent(tool.id)
    closeOverlay()
    goto(tool.path)
  }

  /**
   * @param {KeyboardEvent} e
   */
  function handleKeydown(/** @type {KeyboardEvent} */ e) {
    // Cmd+K / Ctrl+K to open/close - check isOpen FIRST
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      if (!isOpen) {
        openOverlay()
      } else {
        closeOverlay()
      }
      return
    }

    if (!isOpen) return

    // Handle Tab for focus trap
    handleFocusTrap(e)

    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault()
      closeOverlay()
      return
    }

    // Arrow navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      selectedIndex = (selectedIndex + 1) % flatResults.length
      scrollToSelected()
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      selectedIndex = selectedIndex <= 0 ? flatResults.length - 1 : selectedIndex - 1
      scrollToSelected()
      return
    }

    // Enter to select
    if (e.key === 'Enter') {
      e.preventDefault()
      if (flatResults[selectedIndex]) {
        selectTool(flatResults[selectedIndex])
      }
      return
    }

    // Cmd+[1-9] quick access
    if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
      e.preventDefault()
      const index = parseInt(e.key) - 1
      if (flatResults[index]) {
        selectTool(flatResults[index])
      }
      return
    }
  }

  function scrollToSelected() {
    tick().then(() => {
      const selectedEl = resultsContainer?.querySelector('.result-item.selected')
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    })
  }

  /**
   * @param {string} text
   * @param {string} queryText
   * @returns {string}
   */
  function highlightMatch(text, queryText) {
    if (!queryText.trim()) return text
    const normalizedQuery = queryText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    let result = ''
    let textIndex = 0
    let queryIndex = 0

    while (textIndex < text.length && queryIndex < normalizedQuery.length) {
      const textChar = normalizedText[textIndex]
      const queryChar = normalizedQuery[queryIndex]

      if (textChar === queryChar) {
        result += `<mark>${text[textIndex]}</mark>`
        queryIndex++
        textIndex++
      } else {
        result += text[textIndex]
        textIndex++
      }
    }

    result += text.slice(textIndex)
    return result
  }

  /**
   * @param {number} groupIndex
   * @param {number} toolIndex
   * @returns {number}
   */
  function getResultIndex(groupIndex, toolIndex) {
    let index = 0
    for (let i = 0; i < groupIndex; i++) {
      index += groupedResults[i].tools.length
    }
    return index + toolIndex
  }
</script>

<svelte:window on:keydown={handleKeydown} on:click={handleClickOutside} />

{#if isOpen}
  <div
    class="overlay-backdrop"
    role="presentation"
    aria-hidden="true"
  ></div>

  <div
    bind:this={overlayContainer}
    class="search-overlay"
    role="dialog"
    aria-modal="true"
    aria-label="Search tools"
  >
    <div class="search-container">
      <!-- Search Header -->
      <div class="search-header">
        <div class="search-icon">
          <Search size={18} />
        </div>
        <input
          bind:this={searchInput}
          bind:value={query}
          type="text"
          class="search-input"
          placeholder="Search tools..."
          aria-label="Search tools"
          autocomplete="off"
          spellcheck="false"
        />
        <div class="search-actions">
          {#if query}
            <button
              class="search-clear"
              on:click={() => { query = ''; searchInput?.focus() }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          {/if}
          <kbd class="kbd-shortcut">ESC</kbd>
        </div>
      </div>

      <!-- Results Area -->
      <div
        bind:this={resultsContainer}
        class="results-container"
        role="listbox"
        tabindex="-1"
        aria-activedescendant={activeDescendantId}
      >
        {#if hasResults}
          {#each groupedResults as group, groupIndex}
            {#if group.tools.length > 0}
              <div class="results-group">
                <div class="group-header">
                  {#if group.label === 'Recent'}
                    <Clock size={12} />
                  {:else if group.label === 'Results'}
                    <Search size={12} />
                  {:else}
                    <Command size={12} />
                  {/if}
                  <span>{group.label}</span>
                </div>

                {#each group.tools as tool, toolIndex}
                  {@const resultIndex = getResultIndex(groupIndex, toolIndex)}
                  {@const isSelected = selectedIndex === resultIndex}
                  {@const shortcutNumber = resultIndex < 9 ? resultIndex + 1 : null}

                  <button
                    id="result-{tool.id}"
                    class="result-item"
                    class:selected={isSelected}
                    on:click={() => selectTool(tool)}
                    on:mouseenter={() => selectedIndex = resultIndex}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div class="result-icon">
                      <svelte:component this={tool.icon} size={18} />
                    </div>

                    <div class="result-content">
                      <div class="result-title">
                        {@html highlightMatch(tool.name, query)}
                      </div>
                      <div class="result-description">
                        {@html highlightMatch(tool.description, query)}
                      </div>
                    </div>

                    <div class="result-meta">
                      <span class="category-badge">
                        {tool.categoryLabel}
                      </span>
                      {#if shortcutNumber}
                        <kbd class="result-shortcut">⌘{shortcutNumber}</kbd>
                      {/if}
                    </div>

                    {#if isSelected}
                      <div class="result-arrow">
                        <ArrowRight size={14} />
                      </div>
                    {/if}
                  </button>
                {/each}
              </div>
            {/if}
          {/each}
        {:else}
          <div class="empty-state">
            <div class="empty-icon">
              <Search size={32} />
            </div>
            <p class="empty-title">No results found</p>
            <p class="empty-text">
              Try searching for "json", "base64", "uuid", or "color"
            </p>
            <div class="empty-suggestions">
              <span class="suggestion-label">Popular:</span>
              {#each ['JSON', 'Base64', 'UUID', 'Hash', 'JWT'] as suggestion}
                <button
                  class="suggestion-chip"
                  on:click={() => { query = suggestion.toLowerCase(); searchInput?.focus() }}
                >
                  {suggestion}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      {#if hasResults}
        <div class="search-footer">
          <div class="footer-hints">
            <span class="footer-hint">
              <kbd>↑↓</kbd> Navigate
            </span>
            <span class="footer-hint">
              <kbd>↵</kbd> Open
            </span>
            <span class="footer-hint">
              <kbd>⌘1</kbd> Quick access
            </span>
            <span class="footer-hint">
              <kbd>esc</kbd> Close
            </span>
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: var(--z-modal);
    animation: fadeIn 150ms ease;
  }

  .search-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
    z-index: calc(var(--z-modal) + 1);
    pointer-events: none;
  }

  .search-container {
    width: 100%;
    max-width: 640px;
    max-height: 70vh;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-md);
    box-shadow:
      0 0 0 1px rgba(0, 0, 0, 0.1),
      0 20px 40px rgba(0, 0, 0, 0.4),
      0 0 0 1px var(--border-subtle) inset;
    overflow: hidden;
    pointer-events: auto;
    animation: slideDown 200ms var(--ease-snap);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Search Header */
  .search-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-elevated);
  }

  .search-icon {
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    font-size: var(--text-base);
    font-weight: var(--font-normal);
    color: var(--text-primary);
    background: transparent;
    border: none;
    outline: none;
    padding: var(--space-2) var(--space-3);
    min-width: 0;
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .search-input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius);
    color: var(--text-tertiary);
    background: var(--bg-hover);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .search-clear:hover {
    background: var(--bg-active);
    color: var(--text-primary);
  }

  .search-clear:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .kbd-shortcut {
    display: inline-flex;
    align-items: center;
    padding: 2px 6px;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-tertiary);
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
  }

  /* Results Container */
  .results-container {
    max-height: calc(70vh - 140px);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .results-group {
    padding: var(--space-2) 0;
  }

  .results-group + .results-group {
    border-top: 1px solid var(--border-subtle);
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--text-tertiary);
  }

  /* Result Item */
  .result-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
    padding: var(--space-3) var(--space-4);
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: all var(--transition-fast);
    position: relative;
  }

  .result-item:hover,
  .result-item.selected {
    background: var(--bg-hover);
  }

  .result-item.selected {
    background: var(--accent-soft);
  }

  .result-item:focus-visible {
    outline: none;
    box-shadow: var(--glow-focus) inset;
  }

  .result-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius);
    background: var(--bg-elevated);
    color: var(--accent);
    border: 1px solid var(--border-subtle);
  }

  .result-item.selected .result-icon {
    background: var(--accent-dim);
    color: var(--accent);
    border-color: var(--accent-dim);
  }

  .result-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .result-title {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin-bottom: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-title :global(mark) {
    background: var(--accent-soft);
    color: var(--accent);
    border-radius: var(--radius-sm);
    padding: 0 1px;
  }

  .result-description {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-description :global(mark) {
    background: var(--accent-soft);
    color: var(--accent);
    border-radius: var(--radius-sm);
    padding: 0 1px;
  }

  .result-meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  .category-badge {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-tertiary);
    padding: 2px 8px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
  }

  .result-shortcut {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-tertiary);
    padding: 2px 6px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
  }

  .result-item.selected .result-shortcut {
    background: var(--accent-dim);
    border-color: var(--accent-dim);
    color: var(--accent);
  }

  .result-arrow {
    flex-shrink: 0;
    color: var(--accent);
    opacity: 0.8;
  }

  /* Empty State */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-10) var(--space-6);
    text-align: center;
  }

  .empty-icon {
    color: var(--text-muted);
    margin-bottom: var(--space-4);
    opacity: 0.6;
  }

  .empty-title {
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin: 0 0 var(--space-2) 0;
  }

  .empty-text {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin: 0 0 var(--space-4) 0;
  }

  .empty-suggestions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    justify-content: center;
  }

  .suggestion-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
  }

  .suggestion-chip {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    padding: var(--space-1) var(--space-2);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .suggestion-chip:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .suggestion-chip:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* Footer */
  .search-footer {
    padding: var(--space-2) var(--space-4);
    border-top: 1px solid var(--border-subtle);
    background: var(--bg-elevated);
  }

  .footer-hints {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .footer-hint {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .footer-hint kbd {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: var(--font-medium);
    color: var(--text-tertiary);
    padding: 1px 4px;
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
  }

  /* Scrollbar */
  .results-container::-webkit-scrollbar {
    width: 6px;
  }

  .results-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .results-container::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-full);
  }

  .results-container::-webkit-scrollbar-thumb:hover {
    background: var(--border-strong);
  }

  /* Responsive */
  @media (max-width: 768px) {
    .search-overlay {
      padding: var(--space-4);
      align-items: center;
    }

    .search-container {
      max-height: 80vh;
      max-width: 100%;
    }

    .results-container {
      max-height: calc(80vh - 140px);
    }

    .footer-hints {
      gap: var(--space-2);
    }

    .footer-hint:nth-child(3),
    .footer-hint:nth-child(4) {
      display: none;
    }

    .kbd-shortcut {
      display: none;
    }
  }
</style>
