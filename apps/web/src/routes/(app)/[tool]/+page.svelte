<script>
  import { page } from '$app/stores'
  import { seo } from '$lib/config/seo.js'

  export let data

  $: tool = $page.params.tool
  // `$page.params.tool` is typed `string | undefined` in the store, and
  // indexing `seo` with undefined is a type error. The ternary narrows `tool`
  // to string; the `{#if toolSeo}` below already guards the no-such-tool case.
  $: toolSeo = tool ? seo[tool] : undefined
</script>

<svelte:head>
  {#if toolSeo}
    <title>{toolSeo.pageTitle}</title>
    <meta name="description" content={toolSeo.pageDescription} />
    <meta name="keywords" content={toolSeo.keywords} />
    <link rel="canonical" href={toolSeo.canonicalUrl} />

    <meta property="og:title" content={toolSeo.pageTitle} />
    <meta property="og:description" content={toolSeo.pageDescription} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={toolSeo.canonicalUrl} />
    <meta property="og:image" content={toolSeo.ogImage} />
    <meta property="og:site_name" content="tols" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={toolSeo.pageTitle} />
    <meta name="twitter:description" content={toolSeo.pageDescription} />
    <meta name="twitter:image" content={toolSeo.ogImage} />

    {@html `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": toolSeo.name,
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "Any",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
      "description": toolSeo.pageDescription,
      "featureList": toolSeo.featureList,
      "url": toolSeo.canonicalUrl,
      "provider": { "@type": "Organization", "name": "tols", "url": "https://tols.arasmehmet.com" }
    })}</script>`}
  {/if}
</svelte:head>

<article>
  <svelte:component this={data.component} />
</article>