<script>
  import { createEventDispatcher } from 'svelte'
  import { base } from '$app/paths'
  import Button from '$lib/ui/Button.svelte'
  import Kbd from '$lib/ui/Kbd.svelte'
  import ThemeControl from '$lib/ui/ThemeControl.svelte'
  import wordmarkBlack from '../../../../../assets/brand/tols-wordmark-black.svg?url'
  import wordmarkWhite from '../../../../../assets/brand/tols-wordmark-white.svg?url'

  export let context = ''

  const dispatch = createEventDispatcher()
  const homeHref = `${base}/`
</script>

<header class="site-header">
  <div class="site-identity">
    <a class="site-wordmark" href={homeHref} aria-label="tols">
      <img class="wordmark-black" src={wordmarkBlack} alt="" width="1774" height="709" />
      <img class="wordmark-white" src={wordmarkWhite} alt="" width="1774" height="709" />
    </a>
    {#if context}
      <span class="identity-separator" aria-hidden="true">/</span>
      <span class="site-context page-title">{context}</span>
    {/if}
  </div>

  <nav class="site-actions" aria-label="Site">
    <a class="resource-link" href="https://www.npmjs.com/package/tols-cli" target="_blank" rel="noopener noreferrer">npm</a>
    <a class="resource-link" href="https://github.com/arasovic/tols" target="_blank" rel="noopener noreferrer">GitHub</a>
    <ThemeControl />
    <Button class="tool-index-trigger" on:click={() => dispatch('openTools')}>
      <span>all tools</span>
      <Kbd keys="⌘K" />
    </Button>
  </nav>
</header>

<style>
  .site-header {
    min-height: var(--header-height);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-2) var(--space-5);
    border-bottom: 1px solid var(--border-default);
    background: var(--bg-base);
  }

  .site-identity,
  .site-actions {
    display: flex;
    align-items: center;
  }

  .site-identity {
    gap: var(--space-2);
    min-width: 0;
  }

  .site-actions {
    gap: var(--space-4);
    flex-shrink: 0;
  }

  .site-wordmark {
    width: 58px;
    display: grid;
    flex-shrink: 0;
  }

  .site-wordmark img {
    grid-area: 1 / 1;
    display: block;
    width: 100%;
    height: auto;
  }

  .wordmark-white {
    display: none !important;
  }

  :global([data-theme='dark']) .wordmark-black {
    display: none;
  }

  :global([data-theme='dark']) .wordmark-white {
    display: block !important;
  }

  .identity-separator,
  .site-context,
  .resource-link {
    font-family: var(--font-mono);
    font-size: var(--text-sm);
  }

  .identity-separator {
    color: var(--text-muted);
  }

  .site-context {
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .resource-link {
    color: var(--text-secondary);
    text-decoration: none;
  }

  .resource-link:hover,
  .resource-link:focus-visible {
    color: var(--text-primary);
  }

  :global(.tool-index-trigger) {
    border: 0;
    padding-inline: 0;
    height: auto;
    color: var(--text-primary);
    background: transparent;
  }

  :global(.tool-index-trigger:hover:not(:disabled)) {
    border-color: transparent;
  }

  @media (max-width: 720px) {
    .site-header {
      padding-inline: var(--space-3);
    }

    .site-actions {
      gap: var(--space-3);
    }

    .resource-link,
    .site-context {
      display: none;
    }

    .identity-separator {
      display: none;
    }
  }

  @media (max-width: 420px) {
    :global(.theme-control span:first-child),
    :global(.theme-control span:nth-child(2)) {
      display: none;
    }

    :global(.tool-index-trigger kbd) {
      display: none;
    }
  }
</style>
