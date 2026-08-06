<!-- apps/web/src/lib/ui/PanelGroup.svelte -->
<script>
  /**
   * Lays a row of Panels out side by side, stacking them on narrow viewports.
   *
   * This is what the tools with more than two panes actually needed from a
   * "page shape". Once ToolShell owns the command strip, the rail and the
   * shortcuts, a tool with eight readouts is a stack of PanelGroups — not a
   * separate primitive with its own copy of the plumbing.
   */

  /** Panels per row once there is room. 1 keeps them stacked at every width. */
  export let columns = 2
</script>

<div class="panel-group" style="--panel-group-columns: {columns}">
  <slot />
</div>

<style>
  .panel-group {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);
    min-height: 0;
  }

  /* 900px matches ToolHeader's stacking point and the workbench panes: below
     it the content column is squeezed by the sidebar, and two panes of
     monospace text side by side start wrapping mid-token. */
  @media (min-width: 900px) {
    .panel-group {
      grid-template-columns: repeat(var(--panel-group-columns), minmax(0, 1fr));
    }
  }
</style>
