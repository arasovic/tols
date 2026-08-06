<script>
  /**
   * Homepage tool card. Markup/styles extracted from the homepage; renders the
   * same anchor card in both the popular strip and the main grid.
   */
  import { base } from '$app/paths'
  import { createEventDispatcher } from 'svelte'
  import { ChevronRight, Star } from 'lucide-svelte'
  import { escapeHtml } from '$lib/utils/html.js'
  import { templateFor } from '$lib/cli/templates.js'

  /** @type {{ path: string, name: string, desc: string }} */
  export let tool
  /** Current search query; matched fragments are wrapped in <mark>. */
  export let query = ''
  /** Popular-strip variant (accent background, no meta footer). */
  export let popular = false
  /** Category label shown in the meta footer (grid variant only). */
  export let categoryLabel = ''
  /** Whether the tool is in the user's favorites. */
  export let favorite = false

  const dispatch = createEventDispatcher()

  /**
   * @param {string} text
   * @param {string} searchQuery
   * @returns {string}
   */
  function highlightMatch(text, searchQuery) {
    if (!searchQuery) return escapeHtml(text)
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (!escaped) return escapeHtml(text)
    const regex = new RegExp(escaped, 'gi')
    let result = ''
    let last = 0
    for (const m of text.matchAll(regex)) {
      result += escapeHtml(text.slice(last, m.index)) + '<mark>' + escapeHtml(m[0]) + '</mark>'
      last = m.index + m[0].length
    }
    return result + escapeHtml(text.slice(last))
  }

  $: template = templateFor(tool.path)
  $: cliCommand = template ? `tols ${template.tool} ${template.defaultAction}` : `tols ${tool.path}`
</script>

<a href="{base}/{tool.path}" class="tool-card" class:popular>
  <span
    class="favorite-star"
    class:active={favorite}
    role="button"
    tabindex="0"
    aria-pressed={favorite}
    aria-label={favorite ? `Remove ${tool.name} from favorites` : `Add ${tool.name} to favorites`}
    title={favorite ? 'Remove from favorites' : 'Add to favorites'}
    on:click|preventDefault|stopPropagation={() => dispatch('togglefavorite')}
    on:keydown|preventDefault|stopPropagation={(e) => { if (e.key === 'Enter' || e.key === ' ') dispatch('togglefavorite') }}
  >
    <Star size={14} />
  </span>
  <div class="tool-card-content">
    <div class="tool-info">
      <h2 class="tool-name">
        {@html highlightMatch(tool.name, query)}
      </h2>
      <p class="tool-desc">
        {@html highlightMatch(tool.desc, query)}
      </p>
      <code class="tool-cmd">{cliCommand}</code>
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
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--space-4);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md);
    text-decoration: none;
    transition: all var(--transition-fast) var(--ease-out);
    min-height: 120px;
  }

  .tool-card:hover {
    border-color: var(--border-strong);
  }

  .tool-card:hover .tool-cmd {
    color: var(--accent);
  }

  .tool-card.popular {
    background: var(--accent-soft);
    border-color: var(--accent-dim);
  }

  .tool-card.popular:hover {
    border-color: var(--accent);
  }

  .favorite-star {
    position: absolute;
    top: var(--space-2);
    right: var(--space-2);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    color: var(--text-muted);
    cursor: pointer;
    opacity: 0;
    transition: all var(--transition-fast) var(--ease-out);
  }

  .favorite-star :global(svg) {
    fill: none;
  }

  .tool-card:hover .favorite-star,
  .favorite-star:focus-visible {
    opacity: 1;
  }

  .favorite-star:hover {
    color: var(--warning);
  }

  .favorite-star.active {
    opacity: 1;
    color: var(--warning);
  }

  .favorite-star.active :global(svg) {
    fill: currentColor;
  }

  .tool-card-content {
    display: flex;
    gap: var(--space-3);
    flex: 1;
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

  .tool-cmd {
    display: block;
    margin-top: var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--text-muted);
    transition: color var(--transition-fast) var(--ease-out);
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
    transition: all var(--transition-fast) var(--ease-out);
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
