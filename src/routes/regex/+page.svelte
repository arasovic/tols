<script>
  import RegexTool from '$lib/tools/RegexTool.svelte'

  const pageTitle = 'Regex Tester - DevUtils | Online Regular Expression Tool'
  const pageDescription = 'Test and debug regular expressions online. Match, replace, and split with regex. Real-time pattern matching with highlighted matches. Free regex tester tool.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/regex'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="regex tester, regular expression, regex debugger, pattern matching, regex online, regex validator, regex tool" />
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
    "name": "Regex Tester",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Real-time pattern matching",
      "Match highlighting",
      "Replace functionality",
      "Split testing",
      "Flag support (g, i, m)",
      "Error detection"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <RegexTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What are Regular Expressions?</h2>
      <p>
        Regular expressions (regex or regexp) are patterns used to match character combinations in strings.
        They are powerful tools for text processing, validation, and manipulation. Regex is supported in
        virtually all programming languages and is essential for tasks like form validation, search and replace,
        and data extraction.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Regex Tester</h2>
      <ol>
        <li><strong>Enter your pattern</strong> - Type your regular expression in the pattern field</li>
        <li><strong>Add test text</strong> - Paste the text you want to test against in the input area</li>
        <li><strong>Set flags</strong> - Enable flags like 'g' (global), 'i' (case-insensitive), 'm' (multiline)</li>
        <li><strong>View matches</strong> - Matches are highlighted in real-time with match count</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Regex Tester Features</h2>
      <ul>
        <li><strong>Real-time matching</strong> - See matches as you type your pattern</li>
        <li><strong>Match highlighting</strong> - Visual indication of matched text</li>
        <li><strong>Flag support</strong> - Enable global, case-insensitive, and multiline modes</li>
        <li><strong>Match details</strong> - View all matches and captured groups</li>
        <li><strong>Error handling</strong> - Get clear error messages for invalid patterns</li>
        <li><strong>Replace mode</strong> - Test find-and-replace operations</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What regex flavor does this tool use?</h3>
      <p>
        This tool uses JavaScript's regular expression engine, which is based on the ECMAScript standard.
        It supports most common regex features including lookahead, lookbehind (in modern browsers),
        and named capture groups.
      </p>

      <h3>What are regex flags?</h3>
      <p>
        Flags modify regex behavior: 'g' (global) finds all matches, 'i' (case-insensitive) ignores case,
        'm' (multiline) makes ^ and $ match line starts/ends. You can combine multiple flags.
      </p>

      <h3>Why is my regex not working?</h3>
      <p>
        Common issues include unescaped special characters, incorrect character classes, or missing flags.
        The tool shows error messages for invalid patterns. Start simple and build up your pattern
        incrementally.
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
