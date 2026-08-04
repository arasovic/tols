<script>
  import CssTool from '$lib/tools/CssTool.svelte'

  const pageTitle = 'CSS Formatter - DevUtils | CSS Beautifier & Minifier'
  const pageDescription = 'Free online CSS formatter and optimizer tool for web developers. Beautify and minify CSS code instantly with proper indentation and whitespace optimization.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/css'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="CSS formatter, CSS beautifier, CSS minifier, online CSS tool" />
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
    "name": "CSS Formatter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Beautify CSS",
      "Minify CSS",
      "Syntax preservation",
      "Real-time preview",
      "One-click copy",
      "Error detection"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <CssTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is CSS Formatter?</h2>
      <p>
        CSS Formatter is a tool that helps you clean up and standardize your CSS code. It can beautify
        minified CSS by adding proper indentation and line breaks, or minify CSS by removing unnecessary
        whitespace for production use. This makes your stylesheets more readable during development
        and more efficient for deployment.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use CSS Formatter</h2>
      <ol>
        <li><strong>Paste your CSS</strong> - Copy and paste your CSS code into the input area</li>
        <li><strong>Choose format</strong> - Select beautify (pretty) or minify (compact) mode</li>
        <li><strong>Process</strong> - Click the format button to transform your CSS</li>
        <li><strong>Copy result</strong> - Copy the formatted CSS to your clipboard</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">CSS Formatter Features</h2>
      <ul>
        <li><strong>Beautify mode</strong> - Add proper indentation and line breaks</li>
        <li><strong>Minify mode</strong> - Remove whitespace for smaller file sizes</li>
        <li><strong>Syntax preservation</strong> - Maintains CSS validity during formatting</li>
        <li><strong>Real-time preview</strong> - See formatted output instantly</li>
        <li><strong>One-click copy</strong> - Copy formatted CSS instantly</li>
        <li><strong>Error detection</strong> - Identifies common CSS syntax issues</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>Why should I minify CSS?</h3>
      <p>
        Minifying CSS reduces file size by removing whitespace, comments, and unnecessary characters.
        This leads to faster page load times and reduced bandwidth usage. Minified CSS should be used
        for production, while beautified CSS is better for development and debugging.
      </p>

      <h3>Will this fix broken CSS?</h3>
      <p>
        This formatter focuses on code formatting rather than fixing syntax errors. While it may
        handle some minor issues, it won't correct invalid properties or broken selectors. For
        validation, use a dedicated CSS validator alongside this tool.
      </p>

      <h3>Does this support CSS preprocessors?</h3>
      <p>
        This tool is designed for standard CSS. While it may work with some SCSS or LESS syntax,
        it's recommended to compile preprocessor code to CSS first, then use this formatter for
        consistent output formatting.
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
