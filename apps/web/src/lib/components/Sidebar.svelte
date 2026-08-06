<script>
  import { page } from '$app/stores'
  import { base } from '$app/paths'
  import { theme } from '$lib/stores/theme'
  import { browser } from '$app/environment'
  import { tools as toolRegistry } from '$lib/config/registry.js'
  import { favorites } from '$lib/stores/favorites.js'
  import { stripBase } from '$lib/utils/paths.js'
  import { aliasFor } from '$lib/ui/aliases.js'
  import { onMount } from 'svelte'
  import { Sun, Moon, Star } from 'lucide-svelte'

  export let isOpen = false

  const tools = toolRegistry.map(tool => ({
    id: tool.id,
    label: tool.label
  }))

  function setTheme() {
    if (browser) {
      document.documentElement.setAttribute('data-theme', $theme)
    }
  }

  onMount(() => {
    setTheme()
  })

  $: if ($theme !== undefined && browser) {
    setTheme()
  }

  function closeDrawer() {
    isOpen = false
  }

  $: pathWithoutBase = stripBase(base, $page.url.pathname)
  $: currentTool = pathWithoutBase.length > 1
    ? pathWithoutBase.slice(1)
    : 'json'
</script>

<svelte:window on:keydown={(e) => {
  if (!browser) return
  // Escape closes drawer on mobile
  if (e.key === 'Escape' && isOpen) {
    closeDrawer()
  }
}} />

<!--
  A closed sidebar is off-canvas by `transform` alone, which hides it from the
  eye but not from the keyboard: its 32 focusables stayed in the tab order, so
  focus vanished off the left edge for 32 presses on every tool route
  (WCAG 2.4.3 + 2.4.7). `inert` is what removes both the tab stops and the
  accessibility-tree entries; `aria-hidden` would do only the second and would
  then be a violation in its own right, since it must not contain focusables.
  Svelte 4 lists `inert` in its boolean-attribute table, so `inert={!isOpen}`
  emits the bare attribute when closed and removes it entirely when open.
-->
<aside class="sidebar" class:open={isOpen} inert={!isOpen}>
  <div class="sidebar-header">
    <a href="{base}/" class="logo" on:click={closeDrawer}>
      <div class="logo-icon">
        <span class="logo-glyph" aria-hidden="true">$</span>
      </div>
      <span class="logo-title">tols</span>
    </a>
    <button type="button" class="theme-toggle" on:click={theme.toggle} aria-label="Toggle theme">
      {#if $theme === 'dark'}
        <Sun size={18} />
      {:else}
        <Moon size={18} />
      {/if}
    </button>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-section">
      <span class="nav-label">Tools</span>
      {#each tools as tool, i}
        <a
          href="{base}/{tool.id}"
          class="nav-item"
          class:active={currentTool === tool.id}
          on:click={closeDrawer}
          style="--delay: {i * 20}ms"
        >
          <div class="nav-item-content">
            <span class="nav-item-icon nav-alias" aria-hidden="true">{aliasFor(tool.id)}</span>
            <span class="nav-item-text">{tool.label}</span>
          </div>
          <span class="nav-item-badges">
            {#if $favorites.includes(tool.id)}
              <span class="nav-fav">
                <Star size={11} />
              </span>
            {/if}
            {#if currentTool === tool.id}
              <span class="nav-item-indicator"></span>
            {/if}
          </span>
        </a>
      {/each}
    </div>
  </nav>

  <div class="sidebar-footer">
    <span class="footer-version">v1.0.0</span>
  </div>
</aside>

<div
  class="sidebar-overlay"
  class:open={isOpen}
  on:click={closeDrawer}
  on:keydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      closeDrawer()
      e.preventDefault()
    }
  }}
  role="button"
  tabindex="0"
  aria-label="Close sidebar"
></div>

<style>
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: var(--sidebar-width);
    height: 100vh;
    display: flex;
    flex-direction: column;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform var(--transition-slow) var(--ease-snap);
    background: var(--bg-surface);
    border-right: 1px solid var(--border-subtle);
  }

  .sidebar.open {
    transform: translateX(0);
  }



  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
    min-height: var(--header-height);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    outline: none;
  }

  .logo:focus-visible {
    outline: none;
    border-radius: var(--radius);
    box-shadow: var(--glow-focus);
  }

  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius);
    background: var(--accent);
    color: white;
    box-shadow: var(--shadow-sm);
  }

  .logo-glyph {
    font-family: var(--font-mono);
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    line-height: 1;
  }

  .logo-title {
    font-family: var(--font-display);
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: var(--tracking-wide);
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius);
    color: var(--text-tertiary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast) var(--ease-out);
  }

  .theme-toggle:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .sidebar-nav {
    flex: 1;
    padding: var(--space-2);
    overflow-y: auto;
    overflow-x: hidden;
  }

  .nav-section {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .nav-label {
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
    color: var(--text-tertiary);
    padding: var(--space-2) var(--space-3);
    margin-bottom: var(--space-1);
  }

  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius);
    color: var(--text-secondary);
    text-decoration: none;
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    transition: all var(--transition-fast) var(--ease-out);
  }

  @media (max-width: 767px) {
    .nav-item {
      animation: slideIn var(--transition) var(--ease-out) backwards;
      animation-delay: var(--delay);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .nav-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: var(--accent-soft);
    color: var(--accent);
  }

  .nav-item.active:hover {
    background: var(--accent-dim);
  }

  .nav-item-content {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .nav-item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* A fixed character-cell column, not a content-sized box. Sizing to content
     let the three-character aliases push their labels 7px right, so 24 of the
     30 labels started at x=41 and 6 at x=48 — a visibly ragged left edge down
     the whole list. `ch` resolves against this element's own font, so the mono
     face is declared here rather than inherited; 3ch is the widest alias the
     ladder in aliases.js can produce and aliases.test.js pins that. Widths in
     ch are the human-ruled character-cell exception to the 4px grid. */
  .nav-alias {
    flex-shrink: 0;
    width: 3ch;
    justify-content: flex-start;
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: var(--font-semibold);
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .nav-item:hover .nav-alias,
  .nav-item.active .nav-alias {
    color: currentColor;
  }

  .nav-item-text {
    position: relative;
    z-index: 1;
  }

  .nav-item-badges {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .nav-item-indicator {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent);
  }

  .nav-fav {
    display: flex;
    align-items: center;
    color: var(--warning);
    flex-shrink: 0;
  }

  .nav-fav :global(svg) {
    fill: currentColor;
  }

  .sidebar-footer {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    justify-content: center;
  }

  .footer-version {
    font-size: var(--text-xs);
    font-family: var(--font-mono);
    color: var(--text-muted);
  }

  .sidebar-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
    z-index: 99;
    opacity: 0;
    visibility: hidden;
    transition: all var(--transition) var(--ease-out);
  }

  .sidebar-overlay.open {
    opacity: 1;
    visibility: visible;
  }

  @media (min-width: 768px) {
    /*
      Only the OPEN sidebar joins the flow. The layout grid is single-column
      until `.sidebar-open` is set, so an unconditional `position: static` here
      turns a closed sidebar into a full-height grid ROW — which pushed the
      entire tool page below the fold at every desktop width. jsdom computes no
      layout, so no unit test can see this; it has to be measured in a browser.
    */
    .sidebar.open {
      position: static;
      transform: none;
      transition: none;
      height: 100vh;
    }

    .sidebar-overlay {
      display: none;
    }
  }

  .sidebar {
    overflow: hidden;
  }

  .sidebar-nav::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar-nav::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar-nav::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-full);
  }
</style>
