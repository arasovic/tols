<script>
  import { page } from '$app/stores'
  import { base } from '$app/paths'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import SearchOverlay from '$lib/components/SearchOverlay.svelte'
  import Kbd from '$lib/ui/Kbd.svelte'
  import { dispatchShortcut } from '$lib/ui/shortcuts.js'
  import { toolTitles } from '$lib/config/tools.js'
  import { getTool } from '$lib/config/registry.js'
  import { addRecent } from '$lib/stores/recentTools.js'
  import { stripBase } from '$lib/utils/paths.js'
  import { browser } from '$app/environment'
  import '../../app.css'

  let sidebarOpen = false
  /** @type {import('$lib/components/SearchOverlay.svelte').default} */
  let searchOverlay

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen
  }

  function openSearch() {
    searchOverlay?.open()
  }

  // `base` is absolute in dev and on the client, but relative ('.' or '..')
  // during prerendering. stripBase resolves it against the current page so the
  // tool segment can be stripped in every environment.
  $: pathWithoutBase = stripBase(base, $page.url.pathname)
  $: currentPath = pathWithoutBase.slice(1) || ''
  $: title = toolTitles[currentPath] || 'tols'

  // Visiting a tool page counts as recent usage, no matter how the user got there
  $: if (browser && currentPath && getTool(currentPath)) {
    addRecent(currentPath)
  }
</script>

<svelte:window on:keydown={(e) => dispatchShortcut(e, {
  palette: () => searchOverlay?.toggle(),
  sidebar: toggleSidebar
})} />

<SearchOverlay bind:this={searchOverlay} />

<div class="layout" class:sidebar-open={sidebarOpen}>
  <Sidebar bind:isOpen={sidebarOpen} />

  <div class="main">
    <header class="header">
      <button type="button" class="menu-btn" on:click={toggleSidebar} aria-label="Toggle menu">
        <span class="menu-glyph" aria-hidden="true">≡</span>
      </button>
      <a class="wordmark" href="{base}/">tols</a>
      <span class="crumb-sep" aria-hidden="true">/</span>
      <!--
        A span, not a heading: all 30 tool components still render their own
        <h1>, so promoting the breadcrumb would give every tool page two.
        Hoisting the heading here is a Phase B step, once no tool carries one.
      -->
      <span class="page-title">{title}</span>
      <div class="header-actions">
        <!-- No aria-label: the visible "search ⌘K" is the accessible name. An
             aria-label of "Open search (Cmd+K)" does not contain the visible
             text, which fails WCAG 2.5.3 for speech input. -->
        <button type="button" class="search-trigger" on:click={() => openSearch()}>
          <span class="search-text">search</span>
          <Kbd keys="⌘K" />
        </button>
      </div>
    </header>

    <main class="content">
      <slot />
    </main>
  </div>
</div>

<style>
  .layout {
    display: grid;
    grid-template-columns: 1fr;
    height: 100vh;
    overflow: hidden;
    background: var(--bg-base);
  }

  @media (min-width: 768px) {
    .layout.sidebar-open {
      grid-template-columns: var(--sidebar-width) 1fr;
    }
  }

  .main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    min-width: 0;
    overflow: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--header-height);
    padding: 0 var(--space-3);
    background: var(--bg-base);
    border-bottom: 1px solid var(--border-subtle);
    flex-shrink: 0;
  }

  .menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: var(--text-tertiary);
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .menu-btn:hover { color: var(--text-primary); }
  .menu-btn:focus-visible { outline: none; box-shadow: var(--glow-focus); }

  .menu-glyph { font-family: var(--font-mono); font-size: var(--text-lg); line-height: 1; }

  .wordmark {
    font-family: var(--font-display);
    font-weight: var(--font-semibold);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    color: var(--text-primary);
    text-decoration: none;
  }

  .crumb-sep { color: var(--text-muted); font-family: var(--font-mono); }

  .page-title {
    flex: 1;
    min-width: 0;
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-actions { display: flex; align-items: center; gap: var(--space-2); }

  .search-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    cursor: pointer;
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .search-trigger:hover { color: var(--text-primary); border-color: var(--border-strong); }
  .search-trigger:focus-visible { outline: none; box-shadow: var(--glow-focus); }

  .content {
    flex: 1;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: var(--space-4);
    overflow-y: auto;
  }

  @media (max-width: 767px) {
    .content { padding: var(--space-3); }
    .search-text { display: none; }
  }
</style>
