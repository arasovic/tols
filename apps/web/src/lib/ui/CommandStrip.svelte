<!-- apps/web/src/lib/ui/CommandStrip.svelte -->
<script>
  import { buildCommand } from '$lib/cli/command.js'
  import { templateFor } from '$lib/cli/templates.js'
  import { createCopyFeedback } from './copyFeedback.js'
  import { onDestroy } from 'svelte'
  import Kbd from './Kbd.svelte'

  /** Registry id of the current tool, e.g. 'json' */
  export let toolId = ''
  /** CLI action; falls back to the template default */
  export let action = ''
  /** Current tool input */
  export let input = ''
  /** Flag values to render, e.g. { indent: 2 } */
  /** @type {Record<string, unknown>} */
  export let flags = {}

  let copied = false
  let failed = false

  const feedback = createCopyFeedback((status) => {
    copied = status === 'copied'
    failed = status === 'failed'
  })

  let command = ''

  $: template = templateFor(toolId)
  $: {
    const resolvedAction = template ? action || template.defaultAction : ''
    const omitDefaultAction = template?.omitDefaultAction === true
      && resolvedAction === template.defaultAction
    command = template
      ? buildCommand({
          tool: template.tool,
          action: resolvedAction,
          defaultAction: template.defaultAction,
          omitDefaultAction,
          positionalArgs: template.positionalArgs,
          input,
          flags,
          inputName: template.inputName
        })
      : ''
  }

  // Exported so Workbench can bind:this and wire ⌘⇧C to the *same* command
  // string the strip displays, instead of rebuilding it from its own state.
  // Rebuilding is how the strip and the shortcut drift apart, and it also loses
  // the visible copied/failed feedback.
  //
  // With an unknown toolId nothing renders and `command` is '', so the shared
  // guard is what stops a keystroke from wiping the clipboard with an empty
  // string against a component that is not even on screen.
  export async function copy() {
    await feedback.copy(command)
  }

  onDestroy(() => feedback.dispose())

  $: copyLabel = failed ? 'failed' : copied ? 'copied' : 'copy'
  $: copyAria = failed
    ? 'Failed to copy command'
    : copied
      ? 'Command copied to clipboard'
      : 'Copy command to clipboard'
</script>

{#if template}
  <div class="command-strip" role="group" aria-label="Equivalent tols command">
    <span class="command-prompt" aria-hidden="true">$</span>
    <code class="command-text">{command}</code>
    <span class="command-caret" aria-hidden="true"></span>
    <button
      type="button"
      class="command-copy"
      class:is-failed={failed}
      on:click={copy}
      aria-label={copyAria}
    >
      {copyLabel}
      <Kbd keys="⌘⇧C" />
    </button>
  </div>
{/if}

<style>
  .command-strip {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    height: var(--command-height);
    padding: 0 var(--space-4);
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-subtle);
    overflow-x: auto;
  }

  .command-prompt {
    flex-shrink: 0;
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    user-select: none;
  }

  /* Sizes to its own content, never to the free space: `flex: 1` stretched the
     box across the whole strip, which stranded the caret ~800px away from the
     last glyph at desktop width. `overflow-x` makes this element the scroll
     container for a long command — without it, `white-space: pre` painted the
     command straight over the copy button below ~600px. Neither is visible to
     jsdom, which computes no layout. */
  /* The global `code` rule (app.css) paints every <code> as an inline chip:
     --bg-elevated, 2px 4px padding, a radius and 0.92em. That is right for a
     code reference inside prose and wrong here — this element IS the terminal
     line, so a chip nested inside the strip reads as a quoted fragment rather
     than a command you could run. Opt out explicitly; the size already comes
     from the scale, but the box does not reset itself. */
  .command-text {
    flex: 0 1 auto;
    min-width: 0;
    overflow-x: auto;
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: var(--text-base);
    white-space: pre;
    background: none;
    padding: 0;
    border-radius: 0;
  }

  /* A block caret is a character cell, so it is sized off the type scale
     (ch/em), never the spacing grid. `ch` and `em` resolve against this
     element's own font, so the mono face is declared here rather than
     inherited — today `--font-sans` happens to alias `--font-mono`, and the
     caret must not silently mis-size if that ever stops being true. */
  .command-caret {
    flex-shrink: 0;
    width: 1ch;
    height: 1em;
    font-family: var(--font-mono);
    font-size: var(--text-base);
    background: var(--accent);
    opacity: 0.35;
  }

  .command-strip:hover .command-caret,
  .command-strip:focus-within .command-caret {
    animation: blink 1s steps(1, end) infinite;
  }

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }

  /* The global reduced-motion guard only clamps duration and iteration count;
     with the default fill-mode the caret would settle at its dim base opacity
     instead of the solid state the design calls for. */
  @media (prefers-reduced-motion: reduce) {
    .command-strip:hover .command-caret,
    .command-strip:focus-within .command-caret {
      animation: none;
      opacity: 1;
    }
  }

  .command-copy {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex-shrink: 0;
    /* Pinned right now that .command-text no longer grows to fill the strip. */
    margin-left: auto;
    padding: var(--space-1) var(--space-2);
    color: var(--text-tertiary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    background: transparent;
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius);
    cursor: pointer;
    transition: color var(--transition-fast) var(--ease-out), border-color var(--transition-fast) var(--ease-out);
  }

  .command-copy:hover {
    color: var(--text-primary);
    border-color: var(--border-strong);
  }

  .command-copy.is-failed {
    color: var(--error);
    border-color: var(--error);
  }

  .command-copy:focus-visible {
    outline: none;
    box-shadow: var(--glow-focus);
  }
</style>
