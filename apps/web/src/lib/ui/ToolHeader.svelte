<!-- apps/web/src/lib/ui/ToolHeader.svelte -->
<script>
  import { getCategoryLabel, getTool } from '$lib/config/registry.js'

  /**
   * Registry id, e.g. 'hash'. The name and description are read from the
   * registry rather than retyped here, because the sidebar, the command
   * palette, search and the page metadata all already read them from there —
   * a second copy in the component is a copy that drifts. It already had:
   * the registry called the hash tool 'Hash Calculator' while its own <h1>
   * said 'Hash Generator'.
   */
  export let toolId = ''
  /** Override the registry name. Only for a tool with no registry entry. */
  export let name = ''
  /** Override the registry description. */
  export let description = ''

  $: entry = toolId ? getTool(toolId) : undefined
  $: resolvedName = name || entry?.name || ''
  $: resolvedLabel = entry?.label || resolvedName
  $: resolvedDescription = description || entry?.description || ''
  $: resolvedCategory = entry ? getCategoryLabel(entry.category) : ''
</script>

<!--
  The <h1> lives here rather than in the app shell because the shell's
  breadcrumb is a <span> — hoisting the heading is only correct once every tool
  renders through this component, and even then the shell would have to learn
  the description. Keeping it here means each tool page has exactly one <h1>,
  which is what the a11y suite asserts.
-->
<header class="tool-header" data-tool-id={toolId || undefined}>
  <div class="tool-meta">
    {#if resolvedCategory}<p class="tool-category">{resolvedCategory}</p>{/if}
    <h1 class="tool-name" aria-label={resolvedName || undefined}>
      <span aria-hidden="true">{resolvedLabel}</span>
    </h1>
    {#if resolvedLabel !== resolvedName}
      <span class="canonical-name" aria-hidden="true">{resolvedName}</span>
    {/if}
    {#if resolvedDescription}<p class="tool-desc">{resolvedDescription}</p>{/if}
  </div>
  <!--
    Optional because a converted tool moves its controls into the ActionRail,
    where they sit next to the panes they act on. Tools still awaiting their
    shape keep them up here; the slot is the bridge between the two states.
  -->
  {#if $$slots.actions}
    <div class="tool-actions"><slot name="actions" /></div>
  {/if}
</header>

<style>
  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    padding: clamp(44px, 7vw, 88px) 0 clamp(32px, 5vw, 64px);
    border-bottom: 1px solid var(--border-default);
  }

  .tool-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-width: 0;
  }

  .tool-name {
    margin: 0;
    color: var(--text-primary);
    font-family: var(--font-display);
    font-size: clamp(46px, 15.3vw, 156px);
    font-weight: var(--font-normal);
    letter-spacing: -0.055em;
    line-height: 0.78;
  }

  .tool-category {
    margin: 0;
    color: var(--text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wide);
    text-transform: uppercase;
  }

  .canonical-name {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .tool-desc {
    margin: 0;
    max-width: 58ch;
    color: var(--text-secondary);
    font-size: var(--text-base);
    line-height: var(--leading-normal);
  }

  .tool-actions {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
  }

  /* The actions drop under the title rather than squeezing it: a row of buttons
     and a description cannot share a line without one of them truncating, and
     the description is the part a first-time visitor needs.

     900px, not the 768px the old tool bars used, because the content column is
     at its narrowest just ABOVE the sidebar breakpoint: at a 780px viewport the
     sidebar is present and takes its width out of the column, while at 760px it
     is hidden and the column gets the whole page. Stacking at 768px would leave
     the tightest case — roughly 769–900px — unstacked. */
  @media (max-width: 900px) {
    .tool-header {
      flex-direction: column;
      align-items: stretch;
      gap: var(--space-6);
    }

    /* Keeps the buttons where they were on the wide layout instead of jumping
       to the opposite edge as the row becomes its own line. */
    .tool-actions {
      justify-content: flex-end;
    }
  }
</style>
