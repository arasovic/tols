<!-- apps/web/tests/fixtures/WorkbenchHarness.svelte -->
<script>
  import Workbench from '$lib/ui/Workbench.svelte'
  import Button from '$lib/ui/Button.svelte'
</script>

<Workbench inputMeta="12 B" outputMeta="24 B">
  <textarea slot="input" class="editor-textarea" value="{'{\"a\":1}'}"></textarea>
  <pre slot="output" class="output-display">formatted output</pre>
  <svelte:fragment slot="rail">
    <Button variant="primary">format</Button>
    <Button variant="ghost">minify</Button>
  </svelte:fragment>
</Workbench>
