<script>
  import { page } from '$app/stores'
  import { theme } from '$lib/stores/theme'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import {
    Braces,
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
    FileCode,
    FileJson,
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
    Zap,
    FileDigit,
    FileBarChart
  } from 'lucide-svelte'

  export let isOpen = false

  const tools = [
    { id: 'json', label: 'JSON', icon: Code },
    { id: 'base64', label: 'Base64', icon: Binary },
    { id: 'url', label: 'URL', icon: Link },
    { id: 'uuid', label: 'UUID', icon: Fingerprint },
    { id: 'hash', label: 'Hash', icon: Hash },
    { id: 'jwt', label: 'JWT', icon: KeyRound },
    { id: 'gzip', label: 'Gzip', icon: Archive },
    { id: 'data-uri', label: 'Data URI', icon: Paperclip },
    { id: 'color', label: 'Color', icon: Palette },
    { id: 'timestamp', label: 'Timestamp', icon: Clock },
    { id: 'regex', label: 'Regex', icon: ScanSearch },
    { id: 'lorem', label: 'Lorem', icon: FileText },
    { id: 'yaml', label: 'YAML', icon: FileJson },
    { id: 'html', label: 'HTML', icon: FileCode },
    { id: 'cron', label: 'Cron', icon: Timer },
    { id: 'xml', label: 'XML', icon: FileStack },
    { id: 'diff', label: 'Diff', icon: GitCompare },
    { id: 'sql', label: 'SQL', icon: Database },
    { id: 'markdown', label: 'Markdown', icon: FileType },
    { id: 'jwt-encoder', label: 'JWT Encoder', icon: Lock },
    { id: 'qrcode', label: 'QR Code', icon: QrCode },
    { id: 'placeholder', label: 'Placeholder', icon: Image },
    { id: 'unicode', label: 'Unicode', icon: Languages },
    { id: 'css', label: 'CSS', icon: Palette },
    { id: 'css-filter', label: 'CSS Filter', icon: Filter },
    { id: 'jsonp', label: 'JSONP', icon: Code },
    { id: 'timezone', label: 'Timezone', icon: Globe },
    { id: 'barcode', label: 'Barcode', icon: Barcode },
    { id: 'password', label: 'Password', icon: Shield },
    { id: 'base-converter', label: 'Base Conv', icon: Calculator }
  ]

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

  $: currentTool = $page.url.pathname.slice(1) || 'json'
</script>

<svelte:window on:keydown={(e) => {
  // Cmd+B / Ctrl+B toggles sidebar on desktop
  if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
    e.preventDefault()
    // Only on desktop (min-width: 768px)
    if (window.innerWidth >= 768) {
      isOpen = !isOpen
    }
  }
  // Escape closes drawer on mobile
  if (e.key === 'Escape' && isOpen) {
    closeDrawer()
  }
}} />

<aside class="sidebar" class:open={isOpen}>
  <div class="sidebar-header">
    <a href="/json" class="logo" on:click={closeDrawer}>
      <div class="logo-icon">
        <Braces size={18} />
      </div>
      <span class="logo-title">DevUtils</span>
    </a>
    <button class="theme-toggle" on:click={theme.toggle} aria-label="Toggle theme">
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
          href="/{tool.id}"
          class="nav-item"
          class:active={currentTool === tool.id}
          on:click={closeDrawer}
          style="--delay: {i * 20}ms"
        >
          <div class="nav-item-content">
            <span class="nav-item-icon">
              <svelte:component this={tool.icon} size={18} />
            </span>
            <span class="nav-item-text">{tool.label}</span>
          </div>
          {#if currentTool === tool.id}
            <span class="nav-item-indicator"></span>
          {/if}
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

  .logo-title {
    font-size: var(--text-base);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    letter-spacing: var(--tracking-tight);
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
    transition: all var(--transition-fast);
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
    transition: all var(--transition-fast);
    animation: slideIn var(--transition) var(--ease-out) backwards;
    animation-delay: var(--delay);
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

  .nav-item-text {
    position: relative;
    z-index: 1;
  }

  .nav-item-indicator {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--accent);
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
    transition: all var(--transition);
  }

  .sidebar-overlay.open {
    opacity: 1;
    visibility: visible;
  }

  @media (min-width: 768px) {
    .sidebar {
      transform: translateX(0);
    }

    .sidebar-overlay {
      display: none;
    }
  }

  .sidebar::-webkit-scrollbar {
    width: 4px;
  }

  .sidebar::-webkit-scrollbar-track {
    background: transparent;
  }

  .sidebar::-webkit-scrollbar-thumb {
    background: var(--border-default);
    border-radius: var(--radius-full);
  }
</style>
