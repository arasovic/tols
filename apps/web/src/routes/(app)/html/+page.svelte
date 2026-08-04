<script>
  import HtmlTool from '$lib/tools/HtmlTool.svelte'

  const pageTitle = 'HTML Formatter - DevUtils | HTML Beautifier & Minifier'
  const pageDescription = 'Free online HTML formatter and optimizer tool for developers. Beautify and minify HTML code instantly with comment removal, attribute quoting, and formatting.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/html'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="HTML formatter, HTML beautifier, HTML minifier, online HTML tool" />
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
    "name": "HTML Formatter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Beautify HTML",
      "Minify HTML",
      "Attribute sorting",
      "Quote normalization",
      "One-click copy",
      "Auto-save"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <HtmlTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is HTML Formatter?</h2>
      <p>
        HTML Formatter beautifies and cleans up HTML code by adding proper indentation and structure.
        It can also minify HTML for production use, removing unnecessary whitespace and comments.
        This tool helps developers maintain clean, readable HTML during development while optimizing
        it for deployment.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use HTML Formatter</h2>
      <ol>
        <li><strong>Paste your HTML</strong> - Copy and paste your HTML code into the editor</li>
        <li><strong>Choose format</strong> - Select beautify (prettify) or minify mode</li>
        <li><strong>Process</strong> - Click the format button to transform your HTML</li>
        <li><strong>Review and copy</strong> - Check the output and copy to your clipboard</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">HTML Formatter Features</h2>
      <ul>
        <li><strong>Beautify mode</strong> - Proper indentation and line breaks</li>
        <li><strong>Minify mode</strong> - Remove whitespace for smaller files</li>
        <li><strong>Attribute sorting</strong> - Consistent attribute ordering</li>
        <li><strong>Quote normalization</strong> - Standardize quote style</li>
        <li><strong>One-click copy</strong> - Copy formatted HTML instantly</li>
        <li><strong>Auto-save</strong> - Saves your input automatically</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>When should I minify HTML?</h3>
      <p>
        Minify HTML before deploying to production. Minification reduces file size by removing
        whitespace, comments, and unnecessary characters, which improves page load times. Keep
        the beautified version for development and editing.
      </p>

      <h3>Will formatting break my HTML?</h3>
      <p>
        No, this formatter preserves the structure and functionality of your HTML. It only changes
        whitespace and formatting, not the actual elements or attributes. However, always review
        the output to ensure it meets your expectations.
      </p>

      <h3>Does this fix invalid HTML?</h3>
      <p>
        This tool focuses on formatting, not validation. While it may handle some minor issues,
        it won't fix structural problems like unclosed tags or invalid nesting. Use an HTML validator
        for checking markup validity.
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
