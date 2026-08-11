<script>
  import { page } from '$app/stores'
  import ErrorSurface from '$lib/components/ErrorSurface.svelte'

  $: status = $page.status || 500
</script>

<svelte:head>
  <title>{status} — tols</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<ErrorSurface {status} />
