<script>
  import YamlTool from '$lib/tools/YamlTool.svelte'

  const pageTitle = 'YAML Formatter - DevUtils | Online YAML Validator & Converter'
  const pageDescription = 'Free online YAML formatter and validator tool. Format, validate, and convert YAML to JSON instantly with full nested structure and array support included.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/yaml'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="YAML formatter, YAML validator, YAML to JSON, JSON to YAML, online YAML tool" />
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
    "name": "YAML Formatter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Real-time validation",
      "Prettify mode",
      "Minify mode",
      "YAML to JSON",
      "JSON to YAML",
      "Error highlighting"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <YamlTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is YAML Formatter?</h2>
      <p>
        YAML Formatter validates, formats, and converts YAML data. YAML (YAML Ain't Markup Language)
        is a human-readable data serialization standard commonly used for configuration files, API
        specifications, and data exchange. This tool helps you ensure your YAML is valid and properly
        formatted, and can convert between YAML and JSON formats.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use YAML Formatter</h2>
      <ol>
        <li><strong>Paste your YAML</strong> - Copy and paste your YAML into the editor</li>
        <li><strong>Validate</strong> - The tool automatically checks for syntax errors</li>
        <li><strong>Format</strong> - Click prettify to format with proper indentation</li>
        <li><strong>Convert</strong> - Convert between YAML and JSON as needed</li>
        <li><strong>Copy result</strong> - Copy the formatted or converted output</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">YAML Formatter Features</h2>
      <ul>
        <li><strong>Real-time validation</strong> - Instantly checks YAML syntax</li>
        <li><strong>Prettify mode</strong> - Proper indentation and formatting</li>
        <li><strong>Minify mode</strong> - Compact YAML output</li>
        <li><strong>YAML to JSON</strong> - Convert YAML to JSON format</li>
        <li><strong>JSON to YAML</strong> - Convert JSON to YAML format</li>
        <li><strong>Error highlighting</strong> - Shows exact location of syntax errors</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is YAML used for?</h3>
      <p>
        YAML is commonly used for configuration files in applications like Docker, Kubernetes,
        Ansible, and CI/CD pipelines. It's also used for API specifications (OpenAPI), data
        serialization, and anywhere human-readable structured data is needed.
      </p>

      <h3>Should I use YAML or JSON?</h3>
      <p>
        Choose YAML when human readability and editing are priorities. YAML supports comments,
        has a cleaner syntax without braces, and is easier for non-technical users. Use JSON
        when you need strict parsing, wide language support, or when working with web APIs.
      </p>

      <h3>Why is my YAML showing errors?</h3>
      <p>
        Common YAML errors include incorrect indentation (spaces, not tabs), missing colons after
        keys, unquoted strings that look like other types, and special characters in unquoted strings.
        The error message will indicate the line number where the problem was detected.
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
