<script>
  import { page } from '$app/stores'
  import { base } from '$app/paths'
  import Sidebar from '$lib/components/Sidebar.svelte'
  import SearchOverlay from '$lib/components/SearchOverlay.svelte'
  import { toolTitles } from '$lib/config/tools.js'
  import { Menu, Search } from 'lucide-svelte'
  import '../app.css'

  let sidebarOpen = false
  /** @type {import('$lib/components/SearchOverlay.svelte').default} */
  let searchOverlay

  function toggleSidebar() {
    sidebarOpen = !sidebarOpen
  }

  function openSearch() {
    searchOverlay?.open()
  }

  $: currentPath = $page.url.pathname.slice(1) || ''
  $: title = toolTitles[currentPath] || 'DevUtils'
  $: normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  $: isHomePage = $page.url.pathname === '/' ||
                   $page.url.pathname === normalizedBase ||
                   $page.url.pathname === normalizedBase + '/'
</script>

<svelte:window on:keydown={(e) => {
  // Cmd+B / Ctrl+B toggles sidebar
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    toggleSidebar()
  }
}} />

<SearchOverlay bind:this={searchOverlay} />

<div class="layout" class:home-layout={isHomePage}>
  {#if !isHomePage}
    <Sidebar bind:isOpen={sidebarOpen} />
  {/if}

  <div class="main" class:home-main={isHomePage}>
    {#if !isHomePage}
      <header class="header">
        <button class="menu-btn" on:click={toggleSidebar} aria-label="Toggle menu">
          <Menu size={20} class="menu-icon" />
        </button>
        <span class="page-title">{title}</span>
        <div class="header-actions">
          <button
            class="search-trigger"
            on:click={() => openSearch()}
            aria-label="Open search (Cmd+K)"
          >
            <Search size={16} />
            <span class="search-text">Search</span>
            <kbd class="kbd">⌘K</kbd>
          </button>
        </div>
      </header>
    {/if}

    <main class="content" class:home-content={isHomePage}>
      <slot />
    </main>
  </div>
</div>

<style>
  .layout {
    display: flex;
    min-height: 100vh;
    background: var(--bg-base);
  }

  .main {
    flex: 1;
    margin-left: 0;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .main.home-main {
    margin-left: 0;
  }

  .content.home-content {
    padding: 0;
  }

  @media (min-width: 768px) {
    .main {
      margin-left: var(--sidebar-width);
    }

    .main.home-main {
      margin-left: 0;
    }

    .content {
      padding: var(--space-5);
    }

    .header {
      padding: var(--space-3) var(--space-5);
    }
  }

  .header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    position: sticky;
    top: 0;
    z-index: var(--z-sticky);
    height: var(--header-height);
    background: var(--glass-bg);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--border-subtle);
  }

  .menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius);
    color: var(--text-secondary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .menu-btn:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .page-title {
    flex: 1;
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: var(--tracking-tight);
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .search-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    color: var(--text-secondary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .search-trigger:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .search-text {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
  }

  .kbd {
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
    white-space: nowrap;
  }

  .content {
    flex: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding: var(--space-4);
    overflow-y: auto;
    width: 100%;
  }

  @media (max-width: 768px) {
    .menu-btn {
      display: flex;
    }

    .content {
      padding: var(--space-3);
    }

    .search-text {
      display: none;
    }

    .search-trigger .kbd {
      display: none;
    }
  }
</style>
