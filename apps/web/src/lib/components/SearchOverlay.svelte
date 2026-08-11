<script>
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { browser } from '$app/environment'
  import { onDestroy, tick } from 'svelte'
  import { Search, ArrowRight, X } from '@lucide/svelte'
  import { searchTools, searchToolsFuzzy } from '$lib/config/searchConfig.js'
  import { recentTools, addRecent } from '$lib/stores/recentTools.js'
  import { escapeHtml } from '$lib/utils/html.js'
  import { templateFor } from '$lib/cli/templates.js'
  import { aliasFor } from '$lib/ui/aliases.js'

  let isOpen = false
  let isOpening = false

  /** @type {HTMLInputElement | undefined} */
  let searchInput = undefined
  /** @type {HTMLDivElement | undefined} */
  let resultsContainer = undefined
  /** @type {HTMLDivElement | undefined} */
  let overlayContainer = undefined
  let selectedIndex = 0
  let query = ''
  /** @type {Element | null} */
  let previouslyFocused = null
  let previousBodyOverflow = ''
  /** @type {HTMLElement | null} */
  let backgroundElement = null
  let backgroundHadAriaHidden = false
  /** @type {string | null} */
  let previousBackgroundAriaHidden = null
  let previousBackgroundInert = false

  $: filteredTools = searchToolsFuzzy(query)
  $: recentToolsData = $recentTools
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

  function openOverlay() {
    if (isOpen) return

    if (browser) {
      previouslyFocused = document.activeElement
      previousBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      backgroundElement = document.querySelector('[data-search-background]')
      if (backgroundElement) {
        previousBackgroundInert = Boolean(backgroundElement.inert)
        backgroundHadAriaHidden = backgroundElement.hasAttribute('aria-hidden')
        previousBackgroundAriaHidden = backgroundElement.getAttribute('aria-hidden')
        backgroundElement.inert = true
        backgroundElement.setAttribute('aria-hidden', 'true')
      }
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

  export function toggle() {
    if (isOpen) closeOverlay()
    else openOverlay()
  }

  function closeOverlay() {
    const elementToFocus = previouslyFocused
    isOpen = false
    query = ''
    selectedIndex = 0
    if (browser) {
      document.body.style.overflow = previousBodyOverflow
      restoreBackground()
    }
    if (browser && elementToFocus instanceof HTMLElement) {
      tick().then(() => {
        elementToFocus.focus()
      })
    }
  }

  onDestroy(() => {
    if (browser && isOpen) {
      document.body.style.overflow = previousBodyOverflow
      restoreBackground()
    }
  })

  function restoreBackground() {
    if (!backgroundElement) return
    backgroundElement.inert = previousBackgroundInert
    if (backgroundHadAriaHidden) {
      backgroundElement.setAttribute('aria-hidden', previousBackgroundAriaHidden ?? '')
    } else {
      backgroundElement.removeAttribute('aria-hidden')
    }
    backgroundElement = null
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
    addRecent(tool.id)
    closeOverlay()
    const targetPath = tool.path.startsWith('/') ? tool.path : `/${tool.path}`
    const finalPath = targetPath.startsWith(base)
      ? targetPath
      : `${base}${targetPath}`
    goto(finalPath)
  }

  /**
   * @param {KeyboardEvent} e
   */
  function handleKeydown(/** @type {KeyboardEvent} */ e) {
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
    if (!queryText.trim()) return escapeHtml(text)
    const normalizedQuery = queryText.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    if (!normalizedQuery) return escapeHtml(text)

    // Normalize char-by-char so each normalized position maps back to its
    // original character. Decompositions can span multiple normalized chars
    // (e.g. ǆ → dz), so indexes would drift without this map.
    const normalizedChars = []
    const indexMap = []
    for (let i = 0; i < text.length; i++) {
      const decomposed = text[i].toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      for (const char of decomposed) {
        normalizedChars.push(char)
        indexMap.push(i)
      }
    }

    let result = ''
    let normalizedIndex = 0
    let queryIndex = 0
    let lastOriginalIndex = -1

    while (normalizedIndex < normalizedChars.length && queryIndex < normalizedQuery.length) {
      const textChar = normalizedChars[normalizedIndex]
      const queryChar = normalizedQuery[queryIndex]
      const originalIndex = indexMap[normalizedIndex]

      if (textChar === queryChar) {
        if (originalIndex !== lastOriginalIndex) {
          result += `<mark>${escapeHtml(text[originalIndex])}</mark>`
          lastOriginalIndex = originalIndex
        }
        queryIndex++
        normalizedIndex++
      } else {
        if (originalIndex !== lastOriginalIndex) {
          result += escapeHtml(text[originalIndex])
          lastOriginalIndex = originalIndex
        }
        normalizedIndex++
      }
    }

    result += escapeHtml(text.slice(lastOriginalIndex + 1))
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
      <div class="index-masthead">
        <span class="index-kicker">tols / all tools</span>
        <h2 class="index-title">Tool index</h2>
      </div>

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
              type="button"
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
                  <span>{group.label}</span>
                </div>

                {#each group.tools as tool, toolIndex}
                  {@const resultIndex = getResultIndex(groupIndex, toolIndex)}
                  {@const isSelected = selectedIndex === resultIndex}
                  {@const shortcutNumber = resultIndex < 9 ? resultIndex + 1 : null}
                  {@const template = templateFor(tool.id)}

                  <button
                    type="button"
                    id="result-{tool.id}"
                    class="result-item"
                    class:selected={isSelected}
                    on:click={() => selectTool(tool)}
                    on:mouseenter={() => selectedIndex = resultIndex}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span class="result-icon result-alias">{aliasFor(tool.id)}</span>

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

                    {#if template}
                      <code class="result-cmd">tols {template.tool} {template.defaultAction}</code>
                    {/if}

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
                  type="button"
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
    background: var(--bg-base);
    z-index: var(--z-modal);
    animation: fadeIn 120ms ease;
  }

  .search-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: stretch;
    justify-content: center;
    background: var(--bg-base);
    z-index: calc(var(--z-modal) + 1);
    pointer-events: auto;
  }

  .search-container {
    width: min(1180px, calc(100% - 48px));
    height: 100dvh;
    max-height: none;
    display: flex;
    flex-direction: column;
    background: var(--bg-base);
    border-right: 1px solid var(--border-default);
    border-left: 1px solid var(--border-default);
    overflow: hidden;
    pointer-events: auto;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .index-masthead {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    padding: clamp(40px, 7vh, 72px) var(--space-5) var(--space-5);
    border-bottom: 1px solid var(--border-default);
  }

  .index-kicker {
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  .index-title {
    color: var(--text-primary);
    font-family: var(--font-display);
    font-size: clamp(44px, 8vw, 96px);
    font-weight: var(--font-normal);
    letter-spacing: -0.04em;
    line-height: 0.85;
  }

  /* Search Header */
  .search-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-base);
  }

  .search-icon {
    color: var(--text-tertiary);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    font-size: var(--text-lg);
    font-weight: var(--font-normal);
    color: var(--text-primary);
    background: transparent;
    border: none;
    outline: none;
    padding: var(--space-2) 0 var(--space-2) var(--space-2);
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
    transition: all var(--transition-fast) var(--ease-out);
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
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    border-radius: 0;
  }

  /* Results Container */
  .results-container {
    flex: 1;
    max-height: none;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .results-group {
    padding: 0;
  }

  .results-group + .results-group {
    border-top: 1px solid var(--border-subtle);
  }

  .group-header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    border-bottom: 1px solid var(--border-default);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--text-tertiary);
  }

  /* Result Item */
  .result-item {
    display: grid;
    grid-template-columns: 4ch minmax(180px, 1fr) auto minmax(180px, auto) 3ch;
    align-items: center;
    gap: var(--space-4);
    width: 100%;
    min-height: 64px;
    padding: var(--space-3) var(--space-5);
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer;
    text-align: left;
    transition: all var(--transition-fast) var(--ease-out);
    position: relative;
  }

  .result-item:hover,
  .result-item.selected {
    background: var(--bg-hover);
  }

  .result-item.selected {
    background: var(--bg-hover);
  }

  .result-item:focus-visible {
    outline: none;
    box-shadow: var(--glow-focus) inset;
  }

  .result-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 3ch;
    height: auto;
    border-radius: 0;
    background: transparent;
    color: var(--text-secondary);
    border: 0;
  }

  .result-alias {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: lowercase;
    letter-spacing: var(--tracking-wide);
  }

  .result-item.selected .result-icon {
    background: transparent;
    color: var(--text-primary);
    border-color: transparent;
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
    padding: 0;
    background: transparent;
    border: 0;
    border-radius: 0;
  }

  .result-shortcut {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    padding: 2px 6px;
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
    border-radius: 0;
    transition:
      color var(--transition-fast) var(--ease-out),
      background var(--transition-fast) var(--ease-out),
      border-color var(--transition-fast) var(--ease-out);
  }

  .result-item.selected .result-shortcut {
    color: var(--bg-base);
    background: var(--text-primary);
    border-color: var(--text-primary);
  }

  .result-cmd {
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    white-space: nowrap;
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
    transition: all var(--transition-fast) var(--ease-out);
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
    padding: var(--space-3) var(--space-5);
    border-top: 1px solid var(--border-default);
    background: var(--bg-base);
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
    color: var(--text-secondary);
    padding: 1px 4px;
    background: var(--bg-surface);
    border: 1px solid var(--border-strong);
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
      padding: 0;
      align-items: stretch;
    }

    .search-container {
      width: 100%;
      height: 100dvh;
      max-height: none;
      border: 0;
    }

    .results-container {
      max-height: none;
    }

    .index-masthead {
      padding: var(--space-8) var(--space-3) var(--space-4);
    }

    .search-header,
    .group-header,
    .search-footer {
      padding-inline: var(--space-3);
    }

    .result-item {
      grid-template-columns: 4ch minmax(0, 1fr) 2ch;
      gap: var(--space-2);
      min-height: 60px;
      padding-inline: var(--space-3);
    }

    .result-meta,
    .result-cmd {
      display: none;
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
