<script>
  import { seo } from '$lib/config/seo.js'

  export let data

  // Keyed off `data.id`, not `$page.params.tool`: the raw param is "xml.html"
  // when someone lands on the flat file GitHub Pages also serves, and looking
  // the head up by that would render no title and no canonical on exactly the
  // page that most needs one. `load()` resolves the id and 404s if it is not
  // a real tool, so this is always a hit.
  $: toolSeo = seo[data.id]
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