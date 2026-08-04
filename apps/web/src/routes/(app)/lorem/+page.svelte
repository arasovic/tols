<script>
  import LoremTool from '$lib/tools/LoremTool.svelte'

  const pageTitle = 'Lorem Ipsum Generator - DevUtils | Free Placeholder Text'
  const pageDescription = 'Generate Lorem Ipsum placeholder text for your designs and mockups. Customize word count, paragraphs, and HTML output. Free online dummy text generator.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/lorem'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="Lorem Ipsum generator, placeholder text, dummy text, lorem generator, placeholder content, mockup text" />
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
    "name": "Lorem Ipsum Generator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Generate paragraphs",
      "Generate sentences",
      "Generate words",
      "Custom word count",
      "HTML output option",
      "One-click copy"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <LoremTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Lorem Ipsum?</h2>
      <p>
        Lorem Ipsum is dummy text used in printing and typesetting since the 1500s. It's derived from
        a work by Cicero and has been the industry standard for placeholder text. Using Lorem Ipsum
        allows designers to focus on layout and typography without being distracted by readable content.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Lorem Ipsum Generator</h2>
      <ol>
        <li><strong>Choose output type</strong> - Select paragraphs, sentences, or words</li>
        <li><strong>Set quantity</strong> - Enter how many units you want to generate</li>
        <li><strong>Toggle HTML</strong> - Enable HTML wrapping if needed for web projects</li>
        <li><strong>Generate and copy</strong> - Click generate and copy the result</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Lorem Ipsum Generator Features</h2>
      <ul>
        <li><strong>Flexible output</strong> - Generate paragraphs, sentences, or words</li>
        <li><strong>Custom count</strong> - Specify exactly how much text you need</li>
        <li><strong>HTML option</strong> - Wrap output in paragraph tags</li>
        <li><strong>Classic text</strong> - Uses standard Lorem Ipsum passages</li>
        <li><strong>One-click copy</strong> - Copy generated text instantly</li>
        <li><strong>Auto-save</strong> - Remembers your preferences</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>Why use Lorem Ipsum instead of real text?</h3>
      <p>
        Lorem Ipsum has a natural-looking letter distribution that mimics readable English without
        actually being readable. This helps stakeholders focus on design elements rather than content,
        and prevents reviewers from getting distracted by the text itself.
      </p>

      <h3>Where does Lorem Ipsum come from?</h3>
      <p>
        Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum"
        (The Extremes of Good and Evil) by Cicero, written in 45 BC. The text has been used
        in typesetting since the 1500s.
      </p>

      <h3>Can I use this for commercial projects?</h3>
      <p>
        Yes, Lorem Ipsum text is in the public domain. You can freely use generated placeholder
        text in any project, commercial or otherwise.
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
