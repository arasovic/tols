<!-- apps/web/src/lib/ui/Workbench.svelte -->
<script>
  import Panel from './Panel.svelte'
  import ActionRail from './ActionRail.svelte'
  import CommandStrip from './CommandStrip.svelte'
  import { dispatchShortcut } from './shortcuts.js'
  import { createCopyFeedback } from './copyFeedback.js'
  import { byteLabel } from './bytes.js'
  import { onDestroy } from 'svelte'

  /**
   * A tool declares *intent* here — which CLI command it mirrors, what its
   * input and output currently are, and how to re-run it. Everything else
   * (rendering the command strip, owning ⌘⏎ / ⌘⇧C / ⌘⇧O, deriving the pane
   * byte counts, guarding the clipboard) is this primitive's job, because
   * every tool component would otherwise carry a verbatim copy of it.
   */

  /** Registry id of the tool, e.g. 'json'. Omit to render no command strip. */
  export let toolId = ''
  /** CLI action for the current mode; falls back to the template default. */
  export let action = ''
  /** Flag values for the command, e.g. { indent: 2 } */
  /** @type {Record<string, unknown>} */
  export let flags = {}
  /** Current tool input. Feeds the command strip and the stdin byte count. */
  export let input = ''
  /** Current tool output. Feeds ⌘⇧O and the stdout byte count. */
  export let output = ''
  /** ⌘⏎ handler. Omitted means the tool does not opt into Run. */
  /** @type {(() => void) | undefined} */
  export let onRun = undefined

  /** Pipe-role label for the left pane */
  export let inputLabel = 'stdin'
  /** Pipe-role label for the right pane */
  export let outputLabel = 'stdout'
  /** Explicit pane metadata. Defaults to the byte count of `input` / `output`,
      and exists for tools whose output is not a plain string. */
  export let inputMeta = ''
  export let outputMeta = ''

  /** @type {CommandStrip | undefined} */
  let strip

  /** @type {import('./copyFeedback.js').CopyStatus} */
  let outputStatus = 'idle'
  const outputFeedback = createCopyFeedback((status) => {
    outputStatus = status
  })
  onDestroy(() => outputFeedback.dispose())

  $: resolvedInputMeta = inputMeta || byteLabel(input)
  // ⌘⇧O reports where the thing it copied lives, so it is no longer the one
  // shortcut that succeeds silently while ⌘⇧C shows `copied` on the strip.
  $: resolvedOutputMeta =
    outputStatus === 'copied'
      ? 'copied'
      : outputStatus === 'failed'
        ? 'copy failed'
        : outputMeta || byteLabel(output)

  /** @param {KeyboardEvent} event */
  function onKeydown(event) {
    dispatchShortcut(event, {
      run: onRun,
      // Delegated rather than rebuilt: the strip is the only place the command
      // string exists, so ⌘⇧C cannot copy something other than what is shown.
      copyCommand: () => strip?.copy(),
      copyOutput: () => outputFeedback.copy(output)
    })
  }
</script>

<svelte:window on:keydown={onKeydown} />

<div class="workbench">
  <CommandStrip bind:this={strip} {toolId} {action} {input} {flags} />

  <div class="workbench-panes">
    <Panel label={inputLabel} meta={resolvedInputMeta}>
      <slot name="input" />
    </Panel>
    <Panel label={outputLabel} meta={resolvedOutputMeta}>
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

  /* :global because the strip is a child component this primitive renders
     itself. Spacing it from here rather than adding a wrapper element keeps
     the gap out of the DOM when CommandStrip renders nothing (no toolId), and
     leaves CommandStrip usable full-bleed somewhere else. */
  .workbench > :global(.command-strip) {
    margin-bottom: var(--space-4);
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
