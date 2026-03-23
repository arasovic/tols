<script>
  import XmlTool from '$lib/tools/XmlTool.svelte'

  const pageTitle = 'XML Formatter - DevUtils | XML Beautifier & Validator'
  const pageDescription = 'Free online XML formatter and validator tool for developers. Format, validate, and minify XML data instantly with CDATA, comment, and syntax support online.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/xml'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="XML formatter, XML validator, XML beautifier, online XML tool" />
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
    "name": "XML Formatter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Prettify XML",
      "Minify XML",
      "Validation",
      "Error highlighting",
      "Syntax highlighting",
      "One-click copy"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <XmlTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is XML Formatter?</h2>
      <p>
        XML Formatter helps you format, validate, and minify XML documents. XML (eXtensible Markup
        Language) is widely used for data storage, configuration files, and data exchange between
        systems. This tool ensures your XML is well-formed, properly indented, and ready for use
        in applications or APIs.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use XML Formatter</h2>
      <ol>
        <li><strong>Paste your XML</strong> - Copy and paste your XML document into the editor</li>
        <li><strong>Choose action</strong> - Select format (prettify), minify, or validate</li>
        <li><strong>Process</strong> - Click the button to transform your XML</li>
        <li><strong>View results</strong> - See formatted output or error messages</li>
        <li><strong>Copy output</strong> - Copy the result to your clipboard</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">XML Formatter Features</h2>
      <ul>
        <li><strong>Prettify mode</strong> - Add proper indentation and line breaks</li>
        <li><strong>Minify mode</strong> - Remove whitespace for smaller file sizes</li>
        <li><strong>Validation</strong> - Check XML for syntax errors</li>
        <li><strong>Error highlighting</strong> - See exact location of errors</li>
        <li><strong>Syntax highlighting</strong> - Colored XML for better readability</li>
        <li><strong>One-click copy</strong> - Copy formatted XML instantly</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is the difference between XML and JSON?</h3>
      <p>
        XML uses tags to define elements and supports attributes, namespaces, and schemas. JSON is
        simpler with key-value pairs and arrays. XML is more verbose but offers more features for
        complex documents. JSON is lighter and more commonly used in modern web APIs.
      </p>

      <h3>Can this validate against an XML Schema?</h3>
      <p>
        This tool performs basic well-formedness validation, checking that tags are properly closed
        and nested. For schema validation against XSD or DTD, you would need a more advanced XML
        validator that supports external schema files.
      </p>

      <h3>Why is my XML not formatting correctly?</h3>
      <p>
        XML must be well-formed to be formatted. Check that all tags are properly closed, attributes
        are quoted, and special characters are escaped. The validator will show you the specific
        line and column where the error occurs.
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
