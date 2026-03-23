<script>
  import JsonTool from '$lib/tools/JsonTool.svelte'

  const pageTitle = 'JSON Formatter - DevUtils | Online JSON Validator & Beautifier'
  const pageDescription = 'Free online JSON formatter, validator, and minifier. Format, validate, and beautify JSON data instantly with syntax error highlighting support included.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/json'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="JSON formatter, JSON validator, JSON beautifier, JSON minifier, JSON parser, online JSON tool, format JSON, validate JSON" />
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
    "name": "JSON Formatter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Format and beautify JSON",
      "Minify JSON for production",
      "Validate JSON syntax",
      "Error detection with line numbers",
      "Syntax highlighting",
      "Copy formatted output"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <JsonTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is JSON Formatter?</h2>
      <p>
        JSON Formatter is a free online tool that helps developers format, validate, and beautify JSON data.
        JSON (JavaScript Object Notation) is a lightweight data interchange format that's easy for humans
        to read and write, and easy for machines to parse and generate.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use JSON Formatter</h2>
      <ol>
        <li><strong>Paste your JSON</strong> - Copy and paste your JSON data into the input area</li>
        <li><strong>Automatic validation</strong> - The tool automatically validates your JSON and shows any errors</li>
        <li><strong>Choose format</strong> - Click "Prettify" for readable formatting or "Minify" for compact output</li>
        <li><strong>Copy result</strong> - Use the copy button to copy the formatted JSON to your clipboard</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">JSON Formatter Features</h2>
      <ul>
        <li><strong>Real-time validation</strong> - Instantly validates JSON syntax as you type</li>
        <li><strong>Error highlighting</strong> - Shows exact line and column numbers for errors</li>
        <li><strong>Prettify mode</strong> - Formats JSON with proper indentation and line breaks</li>
        <li><strong>Minify mode</strong> - Removes whitespace for production-ready JSON</li>
        <li><strong>Auto-save</strong> - Your input is automatically saved to local storage</li>
        <li><strong>One-click copy</strong> - Copy formatted output with a single click</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is JSON?</h3>
      <p>
        JSON (JavaScript Object Notation) is a lightweight, text-based data format that is easy for humans
        to read and write and easy for machines to parse and generate. It's commonly used for data
        transmission between web servers and applications.
      </p>

      <h3>Is my data secure?</h3>
      <p>
        Yes, all processing happens in your browser. Your JSON data is never sent to any server,
        ensuring complete privacy and security.
      </p>

      <h3>Can I format large JSON files?</h3>
      <p>
        Yes, the tool can handle JSON files of substantial size. However, for very large files
        (multiple megabytes), you might experience some performance impact depending on your device.
      </p>

      <h3>Does it support all JSON types?</h3>
      <p>
        Yes, the formatter supports all valid JSON data types including objects, arrays, strings,
        numbers, booleans, and null values.
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
