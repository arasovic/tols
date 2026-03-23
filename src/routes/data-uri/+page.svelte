<script>
  import DataUriTool from '$lib/tools/DataUriTool.svelte'

  const pageTitle = 'Data URI Generator - DevUtils | Convert Files to Data URIs'
  const pageDescription = 'Convert files to Data URIs for inline embedding in web projects instantly. Supports images, fonts, and other file types with automatic MIME type detection.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/data-uri'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="Data URI generator, base64 encoder, inline image, data URL, file to base64" />
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
    "name": "Data URI Generator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Drag and drop",
      "Multiple formats",
      "Automatic MIME type",
      "Size display",
      "CSS ready",
      "One-click copy"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <DataUriTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is a Data URI?</h2>
      <p>
        A Data URI (Uniform Resource Identifier) is a scheme that allows you to embed data directly
        into a document, rather than referencing an external file. It's commonly used to embed
        small images, fonts, or other resources directly in CSS or HTML, reducing HTTP requests
        and improving page load performance.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Data URI Generator</h2>
      <ol>
        <li><strong>Upload a file</strong> - Drag and drop or select a file from your device</li>
        <li><strong>Automatic conversion</strong> - The file is converted to base64 and wrapped in a data URI</li>
        <li><strong>View output</strong> - See the complete data URI string ready for use</li>
        <li><strong>Copy to clipboard</strong> - Copy the data URI to use in your CSS or HTML</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Data URI Generator Features</h2>
      <ul>
        <li><strong>Drag and drop</strong> - Easy file upload with drag-and-drop support</li>
        <li><strong>Multiple formats</strong> - Supports images, fonts, and other file types</li>
        <li><strong>Automatic MIME type</strong> - Detects and sets the correct MIME type</li>
        <li><strong>Size display</strong> - Shows original and encoded sizes</li>
        <li><strong>CSS ready</strong> - Output formatted for CSS background-image use</li>
        <li><strong>One-click copy</strong> - Copy the data URI instantly</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>When should I use Data URIs?</h3>
      <p>
        Use Data URIs for small files like icons, small images, or fonts that are used on every page.
        They eliminate HTTP requests, which can improve initial page load. However, avoid using them
        for large images as they increase HTML/CSS file size and can't be cached separately.
      </p>

      <h3>Do Data URIs affect caching?</h3>
      <p>
        Yes, Data URIs are embedded in the HTML or CSS, so they're cached along with the parent document.
        This means they can't be cached separately or reused across pages. For assets used on multiple
        pages, external files with proper caching headers are usually more efficient.
      </p>

      <h3>What file size is too big for Data URIs?</h3>
      <p>
        As a general rule, keep Data URIs under 2-3KB for best performance. Base64 encoding increases
        file size by about 33%, so a 2KB image becomes ~2.7KB when encoded. Very large Data URIs
        can make your HTML/CSS files unwieldy and slow to parse. Consider external files for anything
        larger than small icons and UI elements.
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
