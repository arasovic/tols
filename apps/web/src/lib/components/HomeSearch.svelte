<script>
  /**
   * Homepage search box + category filter chips.
   * Category chips are built from the registry; 'all' is prepended.
   */
  import { categories } from '$lib/config/registry.js'
  import { Search, X } from 'lucide-svelte'

  /** Two-way: current search text. */
  export let query = ''
  /** Two-way: selected category id ('all' or a registry category id). */
  export let selected = 'all'

  const chips = [
    { id: 'all', label: 'All' },
    ...categories.map(category => ({ id: category.id, label: category.label }))
  ]

  /** @type {HTMLInputElement | undefined} */
  let input = undefined
  let focused = false

  function clear() {
    query = ''
    input?.focus()
  }
</script>

<section class="search-section">
  <div class="search-wrapper" class:expanded={query || focused}>
    <div class="search-icon">
      <Search size={18} />
    </div>
    <input
      bind:this={input}
      bind:value={query}
      on:focus={() => focused = true}
      on:blur={() => focused = false}
      type="text"
      class="search-input"
      placeholder="Search tools..."
      aria-label="Search tools"
    />
    <div class="search-actions">
      {#if query}
        <button type="button" class="search-clear" on:click={clear} aria-label="Clear search">
          <X size={16} />
        </button>
      {/if}
    </div>
  </div>

  <div class="category-filters" role="group" aria-label="Filter by category">
    {#each chips as chip}
      <button type="button"
        class="category-chip"
        class:active={selected === chip.id}
        on:click={() => selected = chip.id}
        aria-pressed={selected === chip.id}
      >
        <span>{chip.label}</span>
      </button>
    {/each}
  </div>
</section>

<style>
  .search-section {
    margin-bottom: var(--space-6);
  }

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 600px;
    margin: 0 auto;
    transition: all var(--transition-fast) var(--ease-out);
  }

  .search-wrapper.expanded {
    max-width: 680px;
  }

  .search-icon {
    position: absolute;
    left: var(--space-4);
    color: var(--text-tertiary);
    pointer-events: none;
  }

  .search-input {
    flex: 1;
    height: 56px;
    padding: 0 calc(var(--space-4) + 50px) 0 var(--space-12);
    font-size: var(--text-base);
    font-weight: var(--font-normal);
    color: var(--text-primary);
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    outline: none;
    transition: all var(--transition-fast) var(--ease-out);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .search-input:hover {
    border-color: var(--border-strong);
  }

  .search-input:focus {
    border-color: var(--accent);
    box-shadow: var(--glow-focus);
  }

  .search-actions {
    position: absolute;
    right: var(--space-3);
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .search-actions > * {
    pointer-events: auto;
  }

  .search-clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
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

  .category-filters {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .category-chip {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast) var(--ease-out);
  }

  .category-chip:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .category-chip.active {
    background: var(--accent-soft);
    border-color: var(--accent-dim);
    color: var(--accent);
  }

  @media (max-width: 640px) {
    .search-input {
      height: 48px;
      font-size: var(--text-base);
      padding-right: var(--space-4);
    }

    .search-clear {
      right: var(--space-4);
    }

    .category-filters {
      gap: var(--space-2);
    }

    .category-chip {
      padding: var(--space-1) var(--space-3);
      font-size: var(--text-xs);
    }
  }
</style>
