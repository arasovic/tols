<!-- apps/web/src/lib/ui/ToolHeader.svelte -->
<script>
  import { getTool } from '$lib/config/registry.js'

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
  $: resolvedDescription = description || entry?.description || ''
</script>

<!--
  The <h1> lives here rather than in the app shell because the shell's
  breadcrumb is a <span> — hoisting the heading is only correct once every tool
  renders through this component, and even then the shell would have to learn
  the description. Keeping it here means each tool page has exactly one <h1>,
  which is what the a11y suite asserts.
-->
<header class="tool-header">
  <div class="tool-meta">
    <h1 class="tool-name">{resolvedName}</h1>
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
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
  }

  .tool-meta {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    min-width: 0;
  }

  .tool-name {
    margin: 0;
    color: var(--text-primary);
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    letter-spacing: var(--tracking-tight);
  }

  .tool-desc {
    margin: 0;
    color: var(--text-tertiary);
    font-size: var(--text-sm);
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
      gap: var(--space-3);
    }

    /* Keeps the buttons where they were on the wide layout instead of jumping
       to the opposite edge as the row becomes its own line. */
    .tool-actions {
      justify-content: flex-end;
    }
  }
</style>
