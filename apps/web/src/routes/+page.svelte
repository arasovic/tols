<script>
  import { base } from '$app/paths'
  import { browser } from '$app/environment'
  import { onMount } from 'svelte'
  import { ArrowRight, ExternalLink } from '@lucide/svelte'
  import { tools as registryTools } from '$lib/config/registry.js'
  import { theme } from '$lib/stores/theme'
  import SiteHeader from '$lib/components/SiteHeader.svelte'
  import SearchOverlay from '$lib/components/SearchOverlay.svelte'
  import { dispatchShortcut } from '$lib/ui/shortcuts.js'
  import wordmarkBlack from '../../../../assets/brand/tols-wordmark-black.svg?url'
  import wordmarkWhite from '../../../../assets/brand/tols-wordmark-white.svg?url'

  const pageTitle = 'tols - Free Developer Utilities & Online Tools'
  const pageDescription = 'Free online developer tools: JSON formatter, Base64 encoder, UUID generator, hash calculator, JWT decoder, and more. Essential utilities for developers.'
  const canonicalUrl = 'https://tols.arasmehmet.com/'
  const ogImage = 'https://tols.arasmehmet.com/og-image-20260814.png'
  const popularTools = registryTools.filter(tool => tool.popular === true)
  /** @type {import('$lib/components/SearchOverlay.svelte').default} */
  let searchOverlay

  function openTools() {
    searchOverlay?.open()
  }

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

<svelte:window on:keydown={(event) => dispatchShortcut(event, {
  palette: () => searchOverlay?.toggle(),
  sidebar: () => searchOverlay?.toggle()
})} />

<SearchOverlay bind:this={searchOverlay} />

<div class="landing-shell" data-search-background>
  <SiteHeader on:openTools={openTools} />

  <!-- The homepage sits outside the app layout, so it owns the skip-link target. -->
  <main id="main-content" tabindex="-1">
    <section class="status-section" aria-labelledby="status-title">
      <span class="wordmark hero-wordmark" aria-hidden="true">
        <img class="wordmark-black" src={wordmarkBlack} alt="" width="1774" height="709" />
        <img class="wordmark-white" src={wordmarkWhite} alt="" width="1774" height="709" />
      </span>
      <p class="brand-claim">STAYS LOCAL</p>
      <h1 id="status-title">Use the web. Keep the command.</h1>
      <p class="status-copy">Developer tools that run locally in your browser and teach the exact tols command.</p>
    </section>

    <section class="access-grid" aria-label="Ways to use tols">
      <article class="cli-section">
        <div class="section-heading">
          <h2>CLI</h2>
          <span>zero runtime dependencies</span>
        </div>

        <p class="section-copy">Install once. Format, encode, hash, generate, and convert without leaving your terminal.</p>

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

        <p class="section-copy">Start in the browser. Every compatible surface shows the command that performs the same work locally.</p>

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
  .landing-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    color: var(--text-primary);
    background: var(--bg-base);
  }

  main,
  .site-footer {
    width: min(1180px, calc(100% - 48px));
    margin-inline: auto;
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
    color: var(--text-primary);
    border-top: 2px solid currentColor;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    line-height: 1;
  }

  h1 {
    max-width: 720px;
    margin: 0;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: clamp(34px, 5.4vw, 68px);
    font-weight: 400;
    letter-spacing: -0.055em;
    line-height: 0.98;
  }

  .status-copy {
    max-width: 590px;
    margin-top: 22px;
    color: var(--text-secondary);
    font-size: clamp(14px, 1.6vw, 17px);
    line-height: 1.55;
  }

  .access-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.85fr);
    border-top: 1px solid var(--border-default);
    border-bottom: 1px solid var(--border-default);
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
    border-left: 1px solid var(--border-default);
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
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 14px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .section-heading span {
    color: var(--text-secondary);
    font-size: 10px;
  }

  .section-copy {
    max-width: 620px;
    min-height: 44px;
    margin-bottom: 30px;
    color: var(--text-secondary);
    font-size: 13px;
    line-height: 1.6;
  }

  .command-block {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 66px;
    padding: 0 20px;
    color: var(--bg-base);
    background: var(--text-primary);
    border: 1px solid var(--text-primary);
  }

  .command-block span {
    color: inherit;
    opacity: 0.55;
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
    color: var(--text-secondary);
    background: var(--bg-surface);
    border-right: 1px solid var(--border-default);
    border-bottom: 1px solid var(--border-default);
    border-left: 1px solid var(--border-default);
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
    color: var(--bg-base);
    background: var(--text-primary);
    border: 1px solid var(--text-primary);
  }

  .primary-link:hover {
    color: var(--bg-base);
    opacity: 0.82;
  }

  .secondary-link {
    color: var(--text-primary);
    border: 1px solid var(--border-default);
  }

  .secondary-link:hover {
    color: var(--text-primary);
    background: var(--bg-hover);
  }

  .web-tool-list {
    display: grid;
    border-top: 1px solid var(--border-default);
  }

  .web-tool-link {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-default);
    font-size: 12px;
    text-decoration: none;
  }

  .web-tool-link:hover {
    padding-left: 8px;
    color: var(--text-primary);
  }

  .site-footer {
    min-height: 72px;
    display: flex;
    align-items: center;
    gap: 18px;
    color: var(--text-secondary);
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  a:focus-visible,
  :global(button:focus-visible) {
    outline: 2px solid var(--text-primary);
    outline-offset: 4px;
  }

  @media (max-width: 760px) {
    main,
    .site-footer {
      width: min(100% - 32px, 1180px);
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
      border-top: 1px solid var(--border-default);
      border-left: 0;
    }

    .section-copy {
      min-height: 0;
    }
  }

  @media (max-width: 460px) {
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
