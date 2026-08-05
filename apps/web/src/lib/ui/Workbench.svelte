<!-- apps/web/src/lib/ui/Workbench.svelte -->
<script>
  import Panel from './Panel.svelte'
  import ActionRail from './ActionRail.svelte'

  /** Pipe-role label for the left pane */
  export let inputLabel = 'stdin'
  /** Pipe-role label for the right pane */
  export let outputLabel = 'stdout'
  export let inputMeta = ''
  export let outputMeta = ''
</script>

<div class="workbench">
  <div class="workbench-panes">
    <Panel label={inputLabel} meta={inputMeta}>
      <slot name="input" />
    </Panel>
    <Panel label={outputLabel} meta={outputMeta}>
      <slot name="output" />
    </Panel>
  </div>

  <ActionRail>
    <slot name="rail" />
    <svelte:fragment slot="end">
      <slot name="rail-end" />
    </svelte:fragment>
  </ActionRail>
</div>

<style>
  .workbench {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .workbench-panes {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-3);
    min-height: 0;
  }

  @media (min-width: 900px) {
    .workbench-panes {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
