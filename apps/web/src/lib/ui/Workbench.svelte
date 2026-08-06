<!-- apps/web/src/lib/ui/Workbench.svelte -->
<script>
  import Panel from './Panel.svelte'
  import PanelGroup from './PanelGroup.svelte'
  import ToolShell from './ToolShell.svelte'
  import { byteLabel } from './bytes.js'

  /**
   * The two-pane shape: stdin on the left, stdout on the right, for a tool
   * that transforms one text into another. Everything that is not the pane
   * grid — the command strip, the action rail, ⌘⏎ / ⌘⇧C / ⌘⇧O — belongs to
   * ToolShell and is shared with the other page shapes.
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

  $: resolvedInputMeta = inputMeta || byteLabel(input)
  $: resolvedOutputMeta = outputMeta || byteLabel(output)
</script>

<ToolShell {toolId} {action} {flags} {input} {output} {onRun} let:copyNotice>
  <PanelGroup>
    <Panel label={inputLabel} meta={resolvedInputMeta}>
      <slot name="input" />
    </Panel>
    <!-- ⌘⇧O reports where the thing it copied lives, so it is no longer the
         one shortcut that succeeds silently while ⌘⇧C shows `copied` on the
         strip. The notice wins over the byte count only while it is set. -->
    <Panel label={outputLabel} meta={copyNotice || resolvedOutputMeta}>
      <slot name="output" />
    </Panel>
  </PanelGroup>

  <svelte:fragment slot="rail"><slot name="rail" /></svelte:fragment>
  <svelte:fragment slot="rail-end"><slot name="rail-end" /></svelte:fragment>
</ToolShell>
