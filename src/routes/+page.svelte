<script>
  import { base } from '$app/paths'
  import { theme } from '$lib/stores/theme'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import {
    Code,
    Binary,
    Link,
    Fingerprint,
    Hash,
    KeyRound,
    Palette,
    Clock,
    ScanSearch,
    FileText,
    Sun,
    Moon,
    Search,
    X,
    ChevronRight,
    SearchX,
    Braces,
    FileJson,
    FileCode,
    Timer,
    FileStack,
    GitCompare,
    Database,
    FileType,
    Lock,
    QrCode,
    Image,
    Languages,
    Globe,
    Calendar,
    Barcode,
    Shield,
    Filter,
    Paperclip,
    Archive,
    Calculator,
    Grip,
    RefreshCw,
    Github,
    Sparkles,
    Zap
  } from 'lucide-svelte'

  const pageTitle = 'DevUtils - Free Developer Utilities & Online Tools'
  const pageDescription = 'Free online developer tools: JSON formatter, Base64 encoder, UUID generator, hash calculator, JWT decoder, and more. Essential utilities for developers.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'

  const categories = [
    { id: 'all', label: 'All', icon: Grip },
    { id: 'data', label: 'Data', icon: Code },
    { id: 'encoding', label: 'Encoding', icon: Binary },
    { id: 'generators', label: 'Generators', icon: Fingerprint },
    { id: 'converters', label: 'Converters', icon: RefreshCw }
  ]

  const tools = [
    {
      path: 'json',
      name: 'JSON Formatter',
      desc: 'Format, validate & beautify JSON data with syntax highlighting',
      category: 'data',
      icon: Code,
      popular: true
    },
    {
      path: 'yaml',
      name: 'YAML Formatter',
      desc: 'Format, validate, and convert YAML to JSON',
      category: 'data',
      icon: FileJson
    },
    {
      path: 'xml',
      name: 'XML Formatter',
      desc: 'Format, validate, and minify XML data',
      category: 'data',
      icon: FileStack
    },
    {
      path: 'html',
      name: 'HTML Formatter',
      desc: 'Beautify, minify, and clean HTML',
      category: 'data',
      icon: FileCode
    },
    {
      path: 'markdown',
      name: 'Markdown Previewer',
      desc: 'Live preview and convert Markdown to HTML',
      category: 'data',
      icon: FileType
    },
    {
      path: 'regex',
      name: 'Regex Tester',
      desc: 'Test & validate regular expressions with real-time matching',
      category: 'data',
      icon: ScanSearch
    },
    {
      path: 'diff',
      name: 'Diff Checker',
      desc: 'Compare two texts and find differences',
      category: 'data',
      icon: GitCompare
    },
    {
      path: 'sql',
      name: 'SQL Formatter',
      desc: 'Format and beautify SQL queries',
      category: 'data',
      icon: Database
    },
    {
      path: 'base64',
      name: 'Base64',
      desc: 'Encode & decode Base64 strings for data transmission',
      category: 'encoding',
      icon: Binary,
      popular: true
    },
    {
      path: 'url',
      name: 'URL Encoder',
      desc: 'Encode & decode URLs and query parameters safely',
      category: 'encoding',
      icon: Link
    },
    {
      path: 'jwt',
      name: 'JWT Decoder',
      desc: 'Decode and inspect JWT token payload and signatures',
      category: 'encoding',
      icon: KeyRound,
      popular: true
    },
    {
      path: 'jwt-encoder',
      name: 'JWT Encoder',
      desc: 'Create and sign JWT tokens with HS256',
      category: 'encoding',
      icon: Lock
    },
    {
      path: 'jsonp',
      name: 'JSONP Tester',
      desc: 'Simulate JSONP requests and parse responses',
      category: 'encoding',
      icon: Code
    },
    {
      path: 'uuid',
      name: 'UUID Generator',
      desc: 'Generate UUID v4 identifiers for your applications',
      category: 'generators',
      icon: Fingerprint,
      popular: true
    },
    {
      path: 'hash',
      name: 'Hash Calculator',
      desc: 'Calculate MD5, SHA-1, SHA-256, SHA-512 hashes',
      category: 'generators',
      icon: Hash,
      popular: true
    },
    {
      path: 'lorem',
      name: 'Lorem Ipsum',
      desc: 'Generate placeholder text for mockups and prototypes',
      category: 'generators',
      icon: FileText
    },
    {
      path: 'qrcode',
      name: 'QR Code',
      desc: 'Generate QR codes from text or URLs',
      category: 'generators',
      icon: QrCode
    },
    {
      path: 'barcode',
      name: 'Barcode',
      desc: 'Generate Code128 barcodes',
      category: 'generators',
      icon: Barcode
    },
    {
      path: 'password',
      name: 'Password Generator',
      desc: 'Generate secure random passwords with entropy display',
      category: 'generators',
      icon: Shield
    },
    {
      path: 'placeholder',
      name: 'Image Placeholder',
      desc: 'Generate colored placeholder images',
      category: 'generators',
      icon: Image
    },
    {
      path: 'color',
      name: 'Color Converter',
      desc: 'Convert between HEX, RGB, HSL color formats',
      category: 'converters',
      icon: Palette
    },
    {
      path: 'timestamp',
      name: 'Timestamp',
      desc: 'Convert Unix timestamps to readable dates and times',
      category: 'converters',
      icon: Clock
    },
    {
      path: 'timezone',
      name: 'Time Zone',
      desc: 'Convert times between different time zones',
      category: 'converters',
      icon: Globe
    },
    {
      path: 'base-converter',
      name: 'Number Base Converter',
      desc: 'Convert between decimal, binary, hex, and octal',
      category: 'converters',
      icon: Calculator
    },
    {
      path: 'cron',
      name: 'Cron Parser',
      desc: 'Validate cron expressions and see next execution times',
      category: 'converters',
      icon: Timer
    },
    {
      path: 'unicode',
      name: 'Unicode Inspector',
      desc: 'Explore Unicode characters and their properties',
      category: 'converters',
      icon: Languages
    },
    {
      path: 'css',
      name: 'CSS Formatter',
      desc: 'Beautify and minify CSS',
      category: 'converters',
      icon: Palette
    }
  ]

  const popularTools = tools.filter(t => t.popular)

  const heroStats = [
    { value: '25+', label: 'Tools' },
    { value: '5', label: 'Categories' },
    { value: '0', label: 'Data Upload' }
  ]

  let searchQuery = ''
  let selectedCategory = 'all'
  /** @type {HTMLInputElement | undefined} */
  let searchInput = undefined
  let isSearchFocused = false

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
  $: currentCategoryLabel = categories.find(c => c.id === selectedCategory)?.label || 'All'

  /**
    * @param {string} text
    * @param {string} query
    * @returns {string}
    */
  function highlightMatch(text, query) {
    if (!query) return text
    const escaped = escapeRegex(query)
    if (!escaped) return text
    const regex = new RegExp(`(${escaped})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  }

  /**
    * @param {string} string
    * @returns {string}
    */
  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * @param {string} categoryId
   */
  function setCategory(categoryId) {
    selectedCategory = categoryId
  }

  function clearSearch() {
    searchQuery = ''
    searchInput?.focus()
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
  <meta property="og:site_name" content="DevUtils" />

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
          <Braces size={20} />
        </div>
        <span class="logo-title">DevUtils</span>
      </a>
      <button class="theme-toggle" on:click={theme.toggle} aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <Sun size={16} />
        {:else}
          <Moon size={16} />
        {/if}
      </button>
    </div>
  </header>

  <main class="home-main">
    <section class="hero">
      <div class="hero-badge">
        <span class="hero-badge-pulse"></span>
        <Zap size={14} />
        <span>100% Browser-based • No Server Uploads</span>
      </div>
      <h1 class="hero-title">
        Essential Tools for Every <span class="hero-title-highlight">Developer</span>
      </h1>
      <p class="hero-subtitle">
        Free, fast, and secure utilities for your daily workflow.
        From <span class="hero-subtle">JSON formatting</span> to <span class="hero-subtle">Base64 encoding</span> and <span class="hero-subtle">UUID generation</span>.
      </p>
      <div class="hero-stats">
        {#each heroStats as stat}
          <div class="hero-stat">
            <span class="hero-stat-value">{stat.value}</span>
            <span class="hero-stat-label">{stat.label}</span>
          </div>
        {/each}
      </div>
    </section>

    <section class="search-section">
      <div class="search-wrapper" class:expanded={searchQuery || isSearchFocused}>
        <div class="search-icon">
          <Search size={18} />
        </div>
        <input
          bind:this={searchInput}
          bind:value={searchQuery}
          on:focus={() => isSearchFocused = true}
          on:blur={() => isSearchFocused = false}
          type="text"
          class="search-input"
          placeholder="Search tools..."
          aria-label="Search tools"
        />
        <div class="search-actions">
          {#if searchQuery}
            <button class="search-clear" on:click={clearSearch} aria-label="Clear search">
              <X size={16} />
            </button>
          {/if}
        </div>
      </div>

      <div class="category-filters" role="group" aria-label="Filter by category">
        {#each categories as category}
          <button
            class="category-chip"
            class:active={selectedCategory === category.id}
            on:click={() => setCategory(category.id)}
            aria-pressed={selectedCategory === category.id}
          >
            <svelte:component this={category.icon} size={14} />
            <span>{category.label}</span>
          </button>
        {/each}
      </div>
    </section>

    <section class="privacy-banner">
      <div class="privacy-banner-content">
        <div class="privacy-banner-icon">
          <Shield size={24} />
        </div>
        <div class="privacy-banner-text">
          <h3>Privacy & Speed</h3>
          <p>Your data never leaves your browser</p>
        </div>
        <div class="privacy-banner-tags">
          <span class="privacy-tag">
            <span class="privacy-tag-dot green"></span>
            No Server
          </span>
          <span class="privacy-tag">
            <span class="privacy-tag-dot green"></span>
            No Cookies
          </span>
          <span class="privacy-tag">
            <span class="privacy-tag-dot blue"></span>
            Offline Ready
          </span>
        </div>
      </div>
    </section>

    <section class="tools-section" aria-live="polite" aria-atomic="true">
      {#if showPopular}
        <div class="popular-section">
          <div class="section-header">
            <div class="section-title">
              <Sparkles size={16} />
              <span>Popular Tools</span>
            </div>
          </div>
          <div class="tools-grid compact">
            {#each popularTools as tool (tool.path)}
              <a href="{base}/{tool.path}" class="tool-card popular">
                <div class="tool-card-content">
                  <div class="tool-icon">
                    <svelte:component this={tool.icon} size={20} />
                  </div>
                  <div class="tool-info">
                    <h2 class="tool-name">{tool.name}</h2>
                    <p class="tool-desc">{tool.desc}</p>
                  </div>
                </div>
                <div class="tool-arrow">
                  <ChevronRight size={16} />
                </div>
              </a>
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
              <a href="{base}/{tool.path}" class="tool-card">
                <div class="tool-card-content">
                  <div class="tool-icon">
                    <svelte:component this={tool.icon} size={20} />
                  </div>
                  <div class="tool-info">
                    <h2 class="tool-name">
                      {@html highlightMatch(tool.name, searchQuery)}
                    </h2>
                    <p class="tool-desc">
                      {@html highlightMatch(tool.desc, searchQuery)}
                    </p>
                  </div>
                </div>
                <div class="tool-meta">
                  <span class="tool-category">{categories.find(c => c.id === tool.category)?.label}</span>
                  <div class="tool-arrow">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </a>
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
          <button class="btn-secondary" on:click={() => { searchQuery = ''; selectedCategory = 'all'; }}>
            Clear filters
          </button>
        </div>
      {/if}
    </section>

    <footer class="home-footer">
      <div class="footer-links">
        <a href="https://github.com/arasovic/dev-utilities" target="_blank" rel="noopener noreferrer" class="footer-link">
          <Github size={16} />
          <span>GitHub</span>
        </a>
      </div>
      <p class="footer-copyright">© {new Date().getFullYear()} DevUtils. All rights reserved.</p>
    </footer>
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

  .logo-title {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: var(--tracking-tight);
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

  .hero {
    text-align: center;
    margin-bottom: var(--space-8);
  }

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    margin-bottom: var(--space-5);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--accent);
    background: var(--accent-soft);
    border: 1px solid var(--accent-dim);
    border-radius: var(--radius-full);
    position: relative;
  }

  .hero-badge-pulse {
    position: absolute;
    left: var(--space-3);
    width: 6px;
    height: 6px;
    background: var(--accent);
    border-radius: 50%;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.2);
    }
  }

  .hero-title {
    font-size: var(--text-4xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    letter-spacing: var(--tracking-tight);
    line-height: var(--leading-tight);
  }

  .hero-title-highlight {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .hero-subtitle {
    font-size: var(--text-lg);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    max-width: 600px;
    margin: 0 auto var(--space-6);
  }

  .hero-subtle {
    color: var(--text-tertiary);
  }

  .hero-stats {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-8);
    margin-top: var(--space-6);
  }

  .hero-stat {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .hero-stat-value {
    font-size: var(--text-2xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
  }

  .hero-stat-label {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
  }

  .search-section {
    margin-bottom: var(--space-6);
  }

  .search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    max-width: 600px;
    margin: 0 auto;
    transition: all var(--transition-fast);
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
    transition: all var(--transition-fast);
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
    transition: all var(--transition-fast);
  }

  .search-clear:hover {
    background: var(--bg-active);
    color: var(--text-primary);
  }

  .search-shortcut {
    padding: var(--space-1) var(--space-2);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-tertiary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
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
    transition: all var(--transition-fast);
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

  .privacy-banner {
    margin-bottom: var(--space-8);
  }

  .privacy-banner-content {
    display: flex;
    align-items: center;
    gap: var(--space-5);
    padding: var(--space-5) var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
  }

  .privacy-banner-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: var(--accent-soft);
    border-radius: var(--radius);
    color: var(--accent);
    flex-shrink: 0;
  }

  .privacy-banner-text {
    flex: 1;
  }

  .privacy-banner-text h3 {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--space-1) 0;
  }

  .privacy-banner-text p {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin: 0;
  }

  .privacy-banner-tags {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  .privacy-tag {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-full);
  }

  .privacy-tag-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .privacy-tag-dot.green {
    background: var(--success);
  }

  .privacy-tag-dot.blue {
    background: var(--accent);
  }

  .tools-section {
    min-height: 200px;
  }

  .popular-section {
    margin-bottom: var(--space-8);
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

  .section-title :global(svg) {
    color: var(--accent);
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

  .home-footer {
    margin-top: var(--space-10);
    padding-top: var(--space-6);
    border-top: 1px solid var(--border-subtle);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-links {
    display: flex;
    gap: var(--space-4);
  }

  .footer-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-secondary);
    text-decoration: none;
    transition: color var(--transition-fast);
  }

  .footer-link:hover {
    color: var(--text-primary);
  }

  .footer-copyright {
    font-size: var(--text-xs);
    color: var(--text-muted);
    margin: 0;
  }

  @media (max-width: 640px) {
    .home-header {
      padding: var(--space-3) var(--space-4);
    }

    .home-main {
      padding: var(--space-6) var(--space-4);
    }

    .hero {
      margin-bottom: var(--space-6);
    }

    .hero-title {
      font-size: var(--text-2xl);
    }

    .hero-stats {
      flex-direction: column;
      gap: var(--space-3);
    }

    .search-input {
      height: 48px;
      font-size: var(--text-base);
      padding-right: var(--space-4);
    }

    .search-shortcut {
      display: none;
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

    .privacy-banner-content {
      flex-direction: column;
      text-align: center;
      gap: var(--space-4);
    }

    .privacy-banner-tags {
      justify-content: center;
    }

    .tools-grid {
      grid-template-columns: 1fr;
    }

    .tool-card {
      min-height: auto;
    }

    .tool-arrow {
      display: none;
    }

    .home-footer {
      flex-direction: column;
      gap: var(--space-3);
      text-align: center;
    }
  }
</style>
