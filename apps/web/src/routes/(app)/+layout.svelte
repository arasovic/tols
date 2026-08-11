<script>
  import { page } from '$app/stores'
  import { base } from '$app/paths'
  import SiteHeader from '$lib/components/SiteHeader.svelte'
  import SearchOverlay from '$lib/components/SearchOverlay.svelte'
  import { dispatchShortcut } from '$lib/ui/shortcuts.js'
  import { getTool } from '$lib/config/registry.js'
  import { addRecent } from '$lib/stores/recentTools.js'
  import { stripBase } from '$lib/utils/paths.js'
  import { browser } from '$app/environment'
  import '../../app.css'

  /** @type {import('$lib/components/SearchOverlay.svelte').default} */
  let searchOverlay

  function openSearch() {
    searchOverlay?.open()
  }

  // `base` is absolute in dev and on the client, but relative ('.' or '..')
  // during prerendering. stripBase resolves it against the current page so the
  // tool segment can be stripped in every environment.
  $: pathWithoutBase = stripBase(base, $page.url.pathname)
  $: currentPath = pathWithoutBase.slice(1) || ''
  $: title = getTool(currentPath)?.name || 'tols'

  // Visiting a tool page counts as recent usage, no matter how the user got there
  $: if (browser && currentPath && getTool(currentPath)) {
    addRecent(currentPath)
  }
</script>

<svelte:window on:keydown={(e) => dispatchShortcut(e, {
  palette: () => searchOverlay?.toggle(),
  sidebar: () => searchOverlay?.toggle()
})} />

<SearchOverlay bind:this={searchOverlay} />

<div class="layout" data-search-background>
  <div class="main">
    <SiteHeader context={title} on:openTools={openSearch} />

    <!--
      The one <main> of every tool document. The 30 tool routes used to render
      their own <main id="main-content"> inside this one, which is invalid (a
      document has at most one), so the id lives here now and each route
      contributes its bare <article>.

      tabindex="-1" is what actually moves focus. <main> is not focusable by
      default, so activating the skip link would only relocate the sequential
      focus starting point — the next Tab lands inside, but activeElement stays
      on <body>, which means no focus ring and nothing for a screen reader to
      announce. (Chrome alone would paper over it here: `overflow-y: auto` makes
      this a scroll container, and Chrome focuses scroll containers. That is
      Chrome-only and it disappears the moment the content fits.)
    -->
    <main class="content" id="main-content" tabindex="-1">
      <slot />
    </main>
  </div>
</div>

<style>
  .layout {
    min-height: 100vh;
    background: var(--bg-base);
  }

  .main {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-width: 0;
  }

  .content {
    flex: 1;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: var(--space-4);
  }

  @media (max-width: 767px) {
    .content { padding: var(--space-3); }
  }
</style>
