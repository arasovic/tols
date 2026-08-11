<script>
  import { page } from '$app/stores'
  import ErrorSurface from '$lib/components/ErrorSurface.svelte'

  $: status = $page.status || 500
</script>

<svelte:head>
  <!-- Svelte's dynamic title emits an unreachable null branch; numeric coercion keeps this raw head fragment inert. -->
  {@html `<title>${Number(status)} — tols</title>`}
  <meta name="robots" content="noindex" />
</svelte:head>

<ErrorSurface {status} />
