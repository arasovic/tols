<script>
  /**
   * Homepage. Tool data comes from the registry; presentation is split into
   * HomeHero / HomeSearch / PrivacyBanner / ToolCard / HomeFooter.
   */
  import { base } from '$app/paths'
  import { theme } from '$lib/stores/theme'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import { tools as registryTools, categories, getCategoryLabel } from '$lib/config/registry.js'
  import { favorites, toggleFavorite } from '$lib/stores/favorites.js'
  import { recentTools } from '$lib/stores/recentTools.js'
  import HomeHero from '$lib/components/HomeHero.svelte'
  import HomeSearch from '$lib/components/HomeSearch.svelte'
  import PrivacyBanner from '$lib/components/PrivacyBanner.svelte'
  import ToolCard from '$lib/components/ToolCard.svelte'
  import HomeFooter from '$lib/components/HomeFooter.svelte'
  import { Sun, Moon, SearchX } from 'lucide-svelte'

  const pageTitle = 'tols - Free Developer Utilities & Online Tools'
  const pageDescription = 'Free online developer tools: JSON formatter, Base64 encoder, UUID generator, hash calculator, JWT decoder, and more. Essential utilities for developers.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'

  const tools = registryTools.map(tool => ({
    path: tool.id,
    name: tool.name,
    desc: tool.description,
    category: tool.category,
    popular: tool.popular === true
  }))

  const popularTools = tools.filter(tool => tool.popular)

  $: favoriteTools = tools.filter(tool => $favorites.includes(tool.path))
  $: recentList = $recentTools
    .map(id => tools.find(tool => tool.path === id))
    .filter(/** @returns {tool is typeof tools[number]} */ (tool) => tool !== undefined)

  // One value feeds both the headline and the `Tools` stat, which sit in the
  // same viewport at every width. Two independent literals is how they drifted.
  const toolCount = tools.length

  const heroStats = [
    { value: String(toolCount), label: 'Tools' },
    { value: String(categories.length), label: 'Categories' },
    { value: '0', label: 'Data Upload' }
  ]

  let searchQuery = ''
  let selectedCategory = 'all'

  $: filteredTools = tools.filter(tool => {
    const matchesSearch = searchQuery === '' ||
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.desc.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'all' ||
      tool.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  $: hasResults = filteredTools.length > 0
  $: showPopular = searchQuery === '' && selectedCategory === 'all'
  $: currentCategoryLabel = selectedCategory === 'all'
    ? 'All'
    : (getCategoryLabel(selectedCategory) || 'All')

  function clearFilters() {
    searchQuery = ''
    selectedCategory = 'all'
  }

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
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="developer tools, online utilities, JSON formatter, Base64 encoder, UUID generator, hash calculator, developer utilities, free tools" />
  <link rel="canonical" href={canonicalUrl} />

  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:site_name" content="tols" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

<div class="home-container">
  <header class="home-header">
    <div class="header-top">
      <a href="{base}/" class="logo">
        <div class="logo-icon">
          <span class="logo-glyph" aria-hidden="true">$</span>
        </div>
        <span class="logo-title">tols</span>
      </a>
      <button type="button" class="theme-toggle" on:click={theme.toggle} aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <Sun size={16} />
        {:else}
          <Moon size={16} />
        {/if}
      </button>
    </div>
  </header>

  <!-- id is load-bearing: app.html's skip link targets #main-content, and all
       30 tool routes already provide it. Without it the link goes nowhere here. -->
  <main id="main-content" class="home-main">
    <HomeHero stats={heroStats} {toolCount} />

    <HomeSearch bind:query={searchQuery} bind:selected={selectedCategory} />

    <PrivacyBanner />

    <section class="tools-section" aria-live="polite" aria-atomic="true">
      {#if showPopular && favoriteTools.length > 0}
        <div class="favorites-section">
          <div class="section-header">
            <div class="section-title">
              <span>Favorites</span>
            </div>
          </div>
          <div class="tools-grid">
            {#each favoriteTools as tool (tool.path)}
              <ToolCard
                {tool}
                query={searchQuery}
                favorite
                categoryLabel={getCategoryLabel(tool.category)}
                on:togglefavorite={() => toggleFavorite(tool.path)}
              />
            {/each}
          </div>
        </div>
      {/if}

      {#if showPopular && recentList.length > 0}
        <div class="recent-section">
          <div class="section-header">
            <div class="section-title">
              <span>Recent</span>
            </div>
          </div>
          <div class="recent-chips">
            {#each recentList as tool (tool.path)}
              <a href="{base}/{tool.path}" class="recent-chip">{tool.name}</a>
            {/each}
          </div>
        </div>
      {/if}

      {#if showPopular}
        <div class="popular-section">
          <div class="section-header">
            <div class="section-title">
              <span>Popular Tools</span>
            </div>
          </div>
          <div class="tools-grid compact">
            {#each popularTools as tool (tool.path)}
              <ToolCard
                {tool}
                query={searchQuery}
                popular
                favorite={$favorites.includes(tool.path)}
                on:togglefavorite={() => toggleFavorite(tool.path)}
              />
            {/each}
          </div>
        </div>
      {/if}

      {#if hasResults}
        <div class="all-tools-section">
          <div class="section-header">
            <div class="section-title">
              <span>{currentCategoryLabel} Tools</span>
              <span class="tool-count">{filteredTools.length}</span>
            </div>
          </div>
          <div class="tools-grid">
            {#each filteredTools as tool (tool.path)}
              <ToolCard
                {tool}
                query={searchQuery}
                favorite={$favorites.includes(tool.path)}
                categoryLabel={getCategoryLabel(tool.category)}
                on:togglefavorite={() => toggleFavorite(tool.path)}
              />
            {/each}
          </div>
        </div>
      {:else}
        <div class="no-results">
          <div class="no-results-icon">
            <SearchX size={40} />
          </div>
          <h3 class="no-results-title">No results found</h3>
          <p class="no-results-text">Try adjusting your search or category filter</p>
          <button type="button" class="btn-secondary" on:click={clearFilters}>
            Clear filters
          </button>
        </div>
      {/if}
    </section>

    <HomeFooter />
  </main>
</div>

<style>
  .home-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-base);
  }

  .home-header {
    padding: var(--space-4) var(--space-5);
    border-bottom: 1px solid var(--border-subtle);
  }

  .header-top {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    text-decoration: none;
  }

  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius);
    background: var(--accent);
    color: white;
  }

  .logo-glyph {
    font-family: var(--font-mono);
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    line-height: 1;
  }

  .logo-title {
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: var(--tracking-wide);
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: var(--radius);
    color: var(--text-tertiary);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .theme-toggle:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .home-main {
    flex: 1;
    max-width: 900px;
    width: 100%;
    margin: 0 auto;
    padding: var(--space-8) var(--space-5);
  }

  .tools-section {
    min-height: 200px;
  }

  .popular-section {
    margin-bottom: var(--space-8);
  }

  .favorites-section,
  .recent-section {
    margin-bottom: var(--space-8);
  }

  .recent-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .recent-chip {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: var(--bg-surface);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .recent-chip:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
    color: var(--text-primary);
  }

  .section-header {
    margin-bottom: var(--space-4);
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wide);
  }

  .tool-count {
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-tertiary);
    background: var(--bg-elevated);
    border-radius: var(--radius-full);
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .tools-grid.compact {
    gap: var(--space-2);
  }

  .no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12) var(--space-4);
    text-align: center;
  }

  .no-results-icon {
    color: var(--text-muted);
    margin-bottom: var(--space-4);
  }

  .no-results-title {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
  }

  .no-results-text {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin-bottom: var(--space-4);
  }

  .btn-secondary {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .btn-secondary:hover {
    background: var(--bg-hover);
    border-color: var(--border-strong);
  }

  @media (max-width: 640px) {
    .home-header {
      padding: var(--space-3) var(--space-4);
    }

    .home-main {
      padding: var(--space-6) var(--space-4);
    }

    .tools-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
