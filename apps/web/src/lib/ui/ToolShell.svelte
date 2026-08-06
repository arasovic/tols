<!-- apps/web/src/lib/ui/ToolShell.svelte -->
<script>
  import CommandStrip from './CommandStrip.svelte'
  import ActionRail from './ActionRail.svelte'
  import { dispatchShortcut } from './shortcuts.js'
  import { createCopyFeedback } from './copyFeedback.js'
  import { onDestroy } from 'svelte'

  /**
   * Everything a tool page needs that is not its layout: the command strip on
   * top, the action rail underneath, and ownership of ⌘⏎ / ⌘⇧C / ⌘⇧O.
   *
   * This is split out of Workbench because the plumbing was almost all of it —
   * the two-column pane grid is about a dozen lines of the component, and the
   * rest applies unchanged to a tool with eight readout panels or a canvas.
   * Building the remaining page shapes as siblings of Workbench would have
   * copied the shortcut handling and the clipboard guard three more times,
   * which is how they drift.
   *
   * The arrangement goes in the default slot.
   */

  /** Registry id of the tool, e.g. 'json'. Omit to render no command strip. */
  export let toolId = ''
  /** CLI action for the current mode; falls back to the template default. */
  export let action = ''
  /** Flag values for the command, e.g. { indent: 2 } */
  /** @type {Record<string, unknown>} */
  export let flags = {}
  /** Current tool input. Feeds the command strip. */
  export let input = ''
  /** Current tool output. Feeds ⌘⇧O. */
  export let output = ''
  /** ⌘⏎ handler. Omitted means the tool does not opt into Run. */
  /** @type {(() => void) | undefined} */
  export let onRun = undefined

  /** @type {CommandStrip | undefined} */
  let strip

  /** @type {import('./copyFeedback.js').CopyStatus} */
  let outputStatus = 'idle'
  const outputFeedback = createCopyFeedback((status) => {
    outputStatus = status
  })
  onDestroy(() => outputFeedback.dispose())

  /**
   * Exposed as a slot prop rather than rendered here, because the shell does
   * not know where a given shape shows its output — Workbench has a stdout
   * pane, an inspector has several readouts. Empty while idle so the consumer
   * can write `copyNotice || its own metadata` and get the right precedence
   * without repeating the status names. ⌘⇧O would otherwise be the one
   * shortcut that succeeds silently.
   */
  $: copyNotice = outputStatus === 'copied' ? 'copied' : outputStatus === 'failed' ? 'copy failed' : ''

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

<div class="tool-shell">
  <CommandStrip bind:this={strip} {toolId} {action} {input} {flags} />

  <slot {copyNotice} />

  <ActionRail>
    <slot name="rail" />
    <svelte:fragment slot="end">
      <slot name="rail-end" />
    </svelte:fragment>
  </ActionRail>
</div>

<style>
  /* One owner for the page's vertical rhythm. Workbench used to space only the
     command strip, which was enough while its slot held a single element — the
     pane grid. A shape with several stacked regions (a controls card, a panel
     group, a facts strip) got no separation at all between them, and jsdom
     computes no layout, so nothing in the suite could see them touching.
     `gap` also collapses to nothing when CommandStrip renders no element at
     all (no toolId), which a margin on the strip would not. */
  .tool-shell {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-height: 0;
  }
</style>
