<script>
  import SqlTool from '$lib/tools/SqlTool.svelte'

  const pageTitle = 'SQL Formatter - DevUtils | SQL Beautifier'
  const pageDescription = 'Free online SQL formatter and beautifier tool for developers. Format SQL queries instantly with proper indentation, keyword casing, and readable output.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/sql'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="SQL formatter, SQL beautifier, SQL minifier, online SQL tool" />
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
    "name": "SQL Formatter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Standard formatting",
      "Keyword capitalization",
      "Multiple dialects",
      "Query validation",
      "One-click copy",
      "Auto-save"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <SqlTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is SQL Formatter?</h2>
      <p>
        SQL Formatter beautifies and standardizes SQL queries for better readability. It adds proper
        indentation, line breaks, and consistent capitalization to make complex queries easier to
        understand and maintain. Whether you're working with MySQL, PostgreSQL, SQLite, or other
        SQL dialects, this tool helps you format your queries consistently.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use SQL Formatter</h2>
      <ol>
        <li><strong>Paste your SQL</strong> - Copy and paste your SQL query into the editor</li>
        <li><strong>Select dialect</strong> - Choose your SQL dialect if needed</li>
        <li><strong>Format</strong> - Click the format button to beautify your query</li>
        <li><strong>Copy result</strong> - Copy the formatted SQL to use in your project</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">SQL Formatter Features</h2>
      <ul>
        <li><strong>Standard formatting</strong> - Consistent indentation and spacing</li>
        <li><strong>Keyword capitalization</strong> - Uppercase SQL keywords</li>
        <li><strong>Multiple dialects</strong> - Support for various SQL flavors</li>
        <li><strong>Query validation</strong> - Basic syntax checking</li>
        <li><strong>One-click copy</strong> - Copy formatted SQL instantly</li>
        <li><strong>Auto-save</strong> - Saves your work automatically</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>Which SQL dialects are supported?</h3>
      <p>
        This formatter supports standard SQL syntax that works across most major databases including
        MySQL, PostgreSQL, SQLite, SQL Server, and Oracle. Some database-specific features may not
        be formatted exactly according to each dialect's conventions.
      </p>

      <h3>Will formatting change my query logic?</h3>
      <p>
        No, formatting only changes whitespace, indentation, and keyword casing. It does not modify
        your query's logic, structure, or execution. The formatted query will produce identical
        results to the original.
      </p>

      <h3>Can I use this for complex queries with subqueries?</h3>
      <p>
        Yes, the formatter handles complex queries including nested subqueries, CTEs (Common Table
        Expressions), JOINs, and window functions. It intelligently indents nested structures to
        make them more readable.
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
