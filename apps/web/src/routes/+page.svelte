<script>
  import { base } from '$app/paths'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import { ArrowRight, ExternalLink, Moon, Sun } from '@lucide/svelte'
  import { tools as registryTools } from '$lib/config/registry.js'
  import { theme } from '$lib/stores/theme'
  import Button from '$lib/ui/Button.svelte'
  import wordmarkBlack from '../../../../assets/brand/tols-wordmark-black.svg?url'
  import wordmarkWhite from '../../../../assets/brand/tols-wordmark-white.svg?url'

  const pageTitle = 'tols - Free Developer Utilities & Online Tools'
  const pageDescription = 'Free online developer tools: JSON formatter, Base64 encoder, UUID generator, hash calculator, JWT decoder, and more. Essential utilities for developers.'
  const canonicalUrl = 'https://tols.arasmehmet.com/'
  const ogImage = 'https://tols.arasmehmet.com/og-image.png'
  const popularTools = registryTools.filter(tool => tool.popular === true)

  function setTheme() {
    if (browser) {
      document.documentElement.setAttribute('data-theme', $theme)
    }
  }

  onMount(setTheme)

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

<div class="landing-shell">
  <header class="site-header">
    <a href="{base}/" class="brand-link" aria-label="tols home">
      <span class="wordmark brand-wordmark" aria-hidden="true">
        <img class="wordmark-black" src={wordmarkBlack} alt="" width="1774" height="709" />
        <img class="wordmark-white" src={wordmarkWhite} alt="" width="1774" height="709" />
      </span>
    </a>

    <nav class="header-actions" aria-label="Project links">
      <a href="https://www.npmjs.com/package/tols-cli" target="_blank" rel="noopener noreferrer">npm</a>
      <a href="https://github.com/arasovic/tols" target="_blank" rel="noopener noreferrer">GitHub</a>
      <Button class="theme-toggle" on:click={theme.toggle} aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <Sun size={16} />
        {:else}
          <Moon size={16} />
        {/if}
      </Button>
    </nav>
  </header>

  <!-- The homepage sits outside the app layout, so it owns the skip-link target. -->
  <main id="main-content" tabindex="-1">
    <section class="status-section" aria-labelledby="status-title">
      <span class="wordmark hero-wordmark" aria-hidden="true">
        <img class="wordmark-black" src={wordmarkBlack} alt="" width="1774" height="709" />
        <img class="wordmark-white" src={wordmarkWhite} alt="" width="1774" height="709" />
      </span>
      <p class="brand-claim">STAYS LOCAL</p>
      <h1 id="status-title">Interface redesign in progress</h1>
      <p class="status-copy">The tools remain available while we rebuild the interface</p>
    </section>

    <section class="access-grid" aria-label="Ways to use tols">
      <article class="cli-section">
        <div class="section-heading">
          <h2>CLI</h2>
          <span>zero runtime dependencies</span>
        </div>

        <p class="section-copy">Install once, then format, encode, hash, generate and convert from your terminal</p>

        <div class="command-block">
          <span aria-hidden="true">$</span>
          <code class="install-command">npm install -g tols-cli</code>
        </div>

        <div class="command-example" aria-label="CLI example">
          <code>tols json fmt @data.json</code>
          <code>tols hash sha256 &lt;&lt;&lt; "secret"</code>
        </div>

        <div class="primary-actions">
          <a class="primary-link" href="https://www.npmjs.com/package/tols-cli" target="_blank" rel="noopener noreferrer">
            View on npm
            <ExternalLink size={15} aria-hidden="true" />
          </a>
          <a class="secondary-link" href="https://github.com/arasovic/tols" target="_blank" rel="noopener noreferrer">
            View source
          </a>
        </div>
      </article>

      <article class="web-section">
        <div class="section-heading">
          <h2>Web tools</h2>
          <span>available now</span>
        </div>

        <p class="section-copy">Open any tool to enter the current workspace and browse the full collection</p>

        <nav class="web-tool-list" aria-label="Popular web tools">
          {#each popularTools as tool (tool.id)}
            <a class="web-tool-link" href="{base}/{tool.id}">
              <span>{tool.name}</span>
              <ArrowRight size={15} aria-hidden="true" />
            </a>
          {/each}
        </nav>
      </article>
    </section>
  </main>

  <footer class="site-footer">
    <span>open source</span>
    <span>MIT</span>
  </footer>
</div>

<style>
  /*
   * Temporary landing palette: keep it local so this approved holding page
   * cannot change the shared app theme before the full redesign begins.
   */
  .landing-shell {
    --landing-bg: #f4f4f0;
    --landing-ink: #0a0a0a;
    --landing-muted: #65655f;
    --landing-rule: rgba(10, 10, 10, 0.18);
    --landing-soft: rgba(10, 10, 10, 0.055);

    min-height: 100vh;
    display: flex;
    flex-direction: column;
    color: var(--landing-ink);
    background: var(--landing-bg);
  }

  :global([data-theme='dark']) .landing-shell {
    --landing-bg: #0a0a0a;
    --landing-ink: #f4f4f0;
    --landing-muted: #a5a59e;
    --landing-rule: rgba(244, 244, 240, 0.2);
    --landing-soft: rgba(244, 244, 240, 0.07);
  }

  .site-header,
  main,
  .site-footer {
    width: min(1180px, calc(100% - 48px));
    margin-inline: auto;
  }

  .site-header {
    min-height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--landing-rule);
  }

  .brand-link {
    display: flex;
    width: 74px;
    color: var(--landing-ink);
  }

  .wordmark {
    display: grid;
  }

  .wordmark img {
    grid-area: 1 / 1;
    display: block;
    width: 100%;
    height: auto;
  }

  .wordmark .wordmark-white {
    display: none;
  }

  :global([data-theme='dark']) .wordmark .wordmark-black {
    display: none;
  }

  :global([data-theme='dark']) .wordmark .wordmark-white {
    display: block;
  }

  .brand-wordmark {
    width: 100%;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .header-actions a {
    color: var(--landing-muted);
    font-size: 12px;
    text-decoration: none;
  }

  .header-actions a:hover {
    color: var(--landing-ink);
  }

  :global(button.btn.theme-toggle) {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--landing-muted);
    background: transparent;
    border: 1px solid var(--landing-rule);
    border-radius: 0;
  }

  :global(button.btn.theme-toggle:hover) {
    color: var(--landing-ink);
    background: var(--landing-soft);
  }

  main {
    flex: 1;
    outline: none;
  }

  .status-section {
    max-width: 790px;
    padding: clamp(64px, 10vw, 128px) 0 clamp(56px, 8vw, 96px);
  }

  .hero-wordmark {
    width: min(470px, 72vw);
    margin-bottom: 34px;
  }

  .brand-claim {
    display: inline-block;
    margin-bottom: 24px;
    padding-top: 10px;
    color: var(--landing-ink);
    border-top: 2px solid currentColor;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    line-height: 1;
  }

  h1 {
    max-width: 720px;
    margin: 0;
    color: var(--landing-ink);
    font-family: var(--font-mono);
    font-size: clamp(34px, 5.4vw, 68px);
    font-weight: 400;
    letter-spacing: -0.055em;
    line-height: 0.98;
  }

  .status-copy {
    max-width: 590px;
    margin-top: 22px;
    color: var(--landing-muted);
    font-size: clamp(14px, 1.6vw, 17px);
    line-height: 1.55;
  }

  .access-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.85fr);
    border-top: 1px solid var(--landing-rule);
    border-bottom: 1px solid var(--landing-rule);
  }

  .cli-section,
  .web-section {
    padding: clamp(32px, 5vw, 58px) 0;
  }

  .cli-section {
    padding-right: clamp(32px, 5vw, 64px);
  }

  .web-section {
    padding-left: clamp(32px, 5vw, 64px);
    border-left: 1px solid var(--landing-rule);
  }

  .section-heading {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 18px;
  }

  .section-heading h2 {
    margin: 0;
    color: var(--landing-ink);
    font-family: var(--font-mono);
    font-size: 14px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .section-heading span {
    color: var(--landing-muted);
    font-size: 10px;
  }

  .section-copy {
    max-width: 620px;
    min-height: 44px;
    margin-bottom: 30px;
    color: var(--landing-muted);
    font-size: 13px;
    line-height: 1.6;
  }

  .command-block {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 66px;
    padding: 0 20px;
    color: var(--landing-bg);
    background: var(--landing-ink);
    border: 1px solid var(--landing-ink);
  }

  .command-block span {
    color: var(--landing-muted);
  }

  .install-command {
    color: inherit;
    background: transparent;
    font-size: clamp(13px, 1.8vw, 16px);
  }

  .command-example {
    display: grid;
    gap: 10px;
    padding: 18px 20px;
    color: var(--landing-muted);
    background: var(--landing-soft);
    border-right: 1px solid var(--landing-rule);
    border-bottom: 1px solid var(--landing-rule);
    border-left: 1px solid var(--landing-rule);
  }

  .command-example code {
    color: inherit;
    background: transparent;
    font-size: 11px;
  }

  .primary-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: 24px;
  }

  .primary-link,
  .secondary-link {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 16px;
    font-size: 12px;
    text-decoration: none;
  }

  .primary-link {
    color: var(--landing-bg);
    background: var(--landing-ink);
    border: 1px solid var(--landing-ink);
  }

  .primary-link:hover {
    color: var(--landing-bg);
    opacity: 0.82;
  }

  .secondary-link {
    color: var(--landing-ink);
    border: 1px solid var(--landing-rule);
  }

  .secondary-link:hover {
    color: var(--landing-ink);
    background: var(--landing-soft);
  }

  .web-tool-list {
    display: grid;
    border-top: 1px solid var(--landing-rule);
  }

  .web-tool-link {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    color: var(--landing-ink);
    border-bottom: 1px solid var(--landing-rule);
    font-size: 12px;
    text-decoration: none;
  }

  .web-tool-link:hover {
    padding-left: 8px;
    color: var(--landing-ink);
  }

  .site-footer {
    min-height: 72px;
    display: flex;
    align-items: center;
    gap: 18px;
    color: var(--landing-muted);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  a:focus-visible,
  :global(button.btn.theme-toggle:focus-visible) {
    outline: 2px solid var(--landing-ink);
    outline-offset: 4px;
  }

  @media (max-width: 760px) {
    .site-header,
    main,
    .site-footer {
      width: min(100% - 32px, 1180px);
    }

    .site-header {
      min-height: 64px;
    }

    .header-actions {
      gap: 16px;
    }

    .status-section {
      padding: 64px 0 56px;
    }

    .hero-wordmark {
      margin-bottom: 28px;
    }

    .access-grid {
      grid-template-columns: 1fr;
    }

    .cli-section {
      padding-right: 0;
    }

    .web-section {
      padding-left: 0;
      border-top: 1px solid var(--landing-rule);
      border-left: 0;
    }

    .section-copy {
      min-height: 0;
    }
  }

  @media (max-width: 460px) {
    .header-actions a {
      display: none;
    }

    .primary-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .primary-link,
    .secondary-link {
      width: 100%;
    }

    .command-block {
      padding: 0 14px;
    }

    .section-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 6px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .web-tool-link {
      transition: none;
    }
  }
</style>
