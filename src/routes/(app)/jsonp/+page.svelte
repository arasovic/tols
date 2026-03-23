<script>
  import JsonpTool from '$lib/tools/JsonpTool.svelte'

  const pageTitle = 'JSONP Tester - DevUtils | JSONP Request Simulator'
  const pageDescription = 'Free online JSONP tester tool for developers. Simulate JSONP requests and parse responses instantly with full callback function support for cross-domain.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/jsonp'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="JSONP tester, JSONP simulator, JSONP request, cross-origin JSON" />
  <link rel="canonical" href={canonicalUrl} />

  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={pageDescription} />
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={ogImage} />
  <meta property="og:site_name" content="DevUtils" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={pageDescription} />
  <meta name="twitter:image" content={ogImage} />

  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "JSONP Tester",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Cross-domain testing",
      "Custom callback",
      "Response formatting",
      "Error handling",
      "Request history",
      "Query parameter support"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <JsonpTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is JSONP?</h2>
      <p>
        JSONP (JSON with Padding) is a technique used to request data from a server in a different domain,
        bypassing the same-origin policy limitations of standard AJAX requests. It works by injecting a
        script tag to load data wrapped in a callback function. While largely replaced by CORS, JSONP
        is still used for legacy APIs and cross-domain data fetching.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use JSONP Tester</h2>
      <ol>
        <li><strong>Enter URL</strong> - Paste the JSONP endpoint URL</li>
        <li><strong>Set callback name</strong> - Specify the callback function name (usually provided by the API)</li>
        <li><strong>Send request</strong> - Click the button to execute the JSONP request</li>
        <li><strong>View response</strong> - See the returned data in a formatted view</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">JSONP Tester Features</h2>
      <ul>
        <li><strong>Cross-domain testing</strong> - Test JSONP endpoints from any domain</li>
        <li><strong>Custom callback</strong> - Specify any callback function name</li>
        <li><strong>Response formatting</strong> - Pretty-print JSON responses</li>
        <li><strong>Error handling</strong> - Detect and display request errors</li>
        <li><strong>Request history</strong> - Keep track of recent requests</li>
        <li><strong>Query parameter support</strong> - Add custom parameters to requests</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is the difference between JSON and JSONP?</h3>
      <p>
        JSON is a data format. JSONP is a technique for loading JSON data across domains by wrapping
        it in a function call. JSONP responses are executed as JavaScript rather than parsed as data,
        which bypasses the same-origin policy restrictions of XMLHttpRequest.
      </p>

      <h3>Is JSONP still used today?</h3>
      <p>
        JSONP is largely deprecated in favor of CORS (Cross-Origin Resource Sharing), which is a
        more secure and flexible standard. However, some legacy APIs and older systems still use
        JSONP, which is why this testing tool remains useful.
      </p>

      <h3>Why are JSONP requests considered less secure?</h3>
      <p>
        JSONP executes the response as JavaScript, which means malicious code could be executed if
        the API provider is compromised. CORS is preferred because it allows fine-grained control
        over which domains can access resources and doesn't execute responses as code.
      </p>
    </section>
    </div>
  </article>
</main>

<style>
  .seo-section {
    margin-top: var(--space-8);
    padding-top: var(--space-8);
    border-top: 1px solid var(--border-subtle);
  }

  .seo-content {
    width: 100%;
    margin-top: var(--space-6);
    padding: var(--space-6);
    background: var(--bg-surface);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
  }

  .seo-content:first-child {
    margin-top: 0;
  }

  .seo-content h2 {
    font-size: var(--text-xl);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-bottom: var(--space-4);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--border-subtle);
  }

  .seo-content h3 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    margin-top: var(--space-5);
    margin-bottom: var(--space-2);
  }

  .seo-content p {
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin-bottom: var(--space-3);
  }

  .seo-content ul,
  .seo-content ol {
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin-left: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .seo-content li {
    margin-bottom: var(--space-2);
  }

  .seo-content strong {
    color: var(--text-primary);
    font-weight: var(--font-medium);
  }

  @media (max-width: 768px) {
    .seo-section {
      margin-top: var(--space-6);
      padding-top: var(--space-6);
    }

    .seo-content {
      padding: var(--space-4);
      margin-top: var(--space-4);
    }
  }
</style>
