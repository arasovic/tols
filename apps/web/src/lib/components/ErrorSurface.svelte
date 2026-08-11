<script>
  import { base } from '$app/paths'
  import SiteHeader from '$lib/components/SiteHeader.svelte'
  import SearchOverlay from '$lib/components/SearchOverlay.svelte'
  import { dispatchShortcut } from '$lib/ui/shortcuts.js'

  /** @type {import('$lib/components/SearchOverlay.svelte').default} */
  let searchOverlay

  export let status = 500
  $: isNotFound = status === 404
  $: title = isNotFound ? 'Nothing at this address.' : 'The page could not be loaded.'
  $: detail = isNotFound
    ? 'The route may have moved, or it may never have existed.'
    : 'Return home or open the tool index to keep working.'
</script>

<svelte:window on:keydown={(event) => dispatchShortcut(event, {
  palette: () => searchOverlay?.toggle(),
  sidebar: () => searchOverlay?.toggle()
})} />

<SearchOverlay bind:this={searchOverlay} />

<div class="error-shell" data-search-background>
  <SiteHeader context={String(status)} on:openTools={() => searchOverlay?.open()} />

  <main id="main-content" tabindex="-1">
    <p class="error-kicker">HTTP / {status}</p>
    <h1>{status}</h1>
    <div class="error-copy">
      <p class="error-title">{title}</p>
      <p>{detail}</p>
    </div>

    <nav class="error-actions" aria-label="Error recovery">
      <a class="home-link" href="{base}/">Back to tols</a>
      <button type="button" on:click={() => searchOverlay?.open()}>Open tool index</button>
    </nav>
  </main>

  <footer>
    <span>open source</span>
    <span>MIT</span>
  </footer>
</div>

<style>
  .error-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    color: var(--text-primary);
    background: var(--bg-base);
  }

  main,
  footer {
    width: min(1180px, calc(100% - 48px));
    margin-inline: auto;
  }

  main {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(250px, 0.42fr);
    align-content: center;
    gap: var(--space-5) clamp(40px, 8vw, 120px);
    padding-block: clamp(64px, 10vw, 128px);
    outline: none;
  }

  .error-kicker {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    color: var(--text-primary);
    font-family: var(--font-display);
    font-size: clamp(128px, 29vw, 420px);
    font-weight: var(--font-normal);
    letter-spacing: -0.075em;
    line-height: 0.72;
  }

  .error-copy {
    align-self: end;
    padding-bottom: var(--space-3);
    border-bottom: 1px solid var(--border-default);
  }

  .error-copy p {
    margin: 0;
    color: var(--text-secondary);
    font-size: var(--text-sm);
    line-height: var(--leading-normal);
  }

  .error-copy .error-title {
    margin-bottom: var(--space-3);
    color: var(--text-primary);
    font-size: clamp(22px, 3vw, 36px);
    line-height: 1;
  }

  .error-actions {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-default);
  }

  .error-actions a,
  .error-actions button {
    min-height: 42px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--space-4);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    text-decoration: none;
    background: transparent;
    border: 1px solid var(--border-default);
    border-radius: 0;
    cursor: pointer;
  }

  .error-actions .home-link {
    color: var(--bg-base);
    background: var(--text-primary);
    border-color: var(--text-primary);
  }

  .error-actions a:hover,
  .error-actions button:hover {
    opacity: 0.72;
  }

  .error-actions a:focus-visible,
  .error-actions button:focus-visible {
    outline: 2px solid var(--text-primary);
    outline-offset: 4px;
  }

  footer {
    min-height: 72px;
    display: flex;
    align-items: center;
    gap: var(--space-4);
    color: var(--text-secondary);
    border-top: 1px solid var(--border-default);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  @media (max-width: 760px) {
    main,
    footer {
      width: min(100% - 32px, 1180px);
    }

    main {
      grid-template-columns: 1fr;
      gap: var(--space-6);
      align-content: start;
      padding-block: 72px;
    }

    .error-kicker,
    .error-actions {
      grid-column: 1;
    }

    h1 {
      font-size: clamp(116px, 48vw, 188px);
    }

    .error-copy {
      align-self: auto;
    }
  }

  @media (max-width: 420px) {
    .error-actions {
      align-items: stretch;
      flex-direction: column;
    }

    .error-actions a,
    .error-actions button {
      width: 100%;
    }
  }
</style>
