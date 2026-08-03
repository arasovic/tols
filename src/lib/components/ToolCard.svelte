<script>
  /**
   * Homepage tool card. Markup/styles extracted from the homepage; renders the
   * same anchor card in both the popular strip and the main grid.
   */
  import { base } from '$app/paths'
  import { ChevronRight } from 'lucide-svelte'

  /** @type {{ path: string, name: string, desc: string, icon: any }} */
  export let tool
  /** Current search query; matched fragments are wrapped in <mark>. */
  export let query = ''
  /** Popular-strip variant (accent background, no meta footer). */
  export let popular = false
  /** Category label shown in the meta footer (grid variant only). */
  export let categoryLabel = ''

  /**
   * @param {string} text
   * @param {string} searchQuery
   * @returns {string}
   */
  function highlightMatch(text, searchQuery) {
    if (!searchQuery) return text
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (!escaped) return text
    const regex = new RegExp(`(${escaped})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }
</script>

<a href="{base}/{tool.path}" class="tool-card" class:popular>
  <div class="tool-card-content">
    <div class="tool-icon">
      <svelte:component this={tool.icon} size={20} />
    </div>
    <div class="tool-info">
      <h2 class="tool-name">
        {@html highlightMatch(tool.name, query)}
      </h2>
      <p class="tool-desc">
        {@html highlightMatch(tool.desc, query)}
      </p>
    </div>
  </div>
  {#if popular}
    <div class="tool-arrow">
      <ChevronRight size={16} />
    </div>
  {:else}
    <div class="tool-meta">
      <span class="tool-category">{categoryLabel}</span>
      <div class="tool-arrow">
        <ChevronRight size={16} />
      </div>
    </div>
  {/if}
</a>

<style>
  .tool-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all var(--transition-fast);
    min-height: 120px;
  }

  .tool-card:hover {
    border-color: var(--accent);
    background: var(--bg-elevated);
    box-shadow: var(--shadow-sm);
  }

  .tool-card.popular {
    background: var(--accent-soft);
    border-color: var(--accent-dim);
  }

  .tool-card.popular:hover {
    border-color: var(--accent);
  }

  .tool-card-content {
    display: flex;
    gap: var(--space-3);
    flex: 1;
  }

  .tool-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--accent-soft);
    border-radius: var(--radius);
    color: var(--accent);
  }

  .tool-info {
    flex: 1;
    min-width: 0;
  }

  .tool-name {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-1) 0;
    line-height: var(--leading-snug);
  }

  .tool-name :global(mark) {
    background: var(--accent-soft);
    color: var(--accent);
    padding: 0 2px;
    border-radius: var(--radius-sm);
  }

  .tool-desc {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin: 0;
    line-height: var(--leading-snug);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .tool-desc :global(mark) {
    background: var(--accent-soft);
    color: var(--accent);
    padding: 0 2px;
    border-radius: var(--radius-sm);
  }

  .tool-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border-subtle);
  }

  .tool-category {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }

  .tool-arrow {
    flex-shrink: 0;
    color: var(--text-muted);
    opacity: 0;
    transform: translateX(-4px);
    transition: all var(--transition-fast);
  }

  .tool-card:hover .tool-arrow {
    opacity: 1;
    transform: translateX(0);
    color: var(--accent);
  }

  @media (max-width: 640px) {
    .tool-card {
      min-height: auto;
    }

    .tool-arrow {
      display: none;
    }
  }
</style>
