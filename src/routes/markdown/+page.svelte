<script>
  import MarkdownTool from '$lib/tools/MarkdownTool.svelte'

  const pageTitle = 'Markdown Previewer - DevUtils | Live Markdown Preview'
  const pageDescription = 'Free online Markdown previewer and converter tool for web developers. Live preview and convert Markdown to HTML with syntax highlighting support included.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/markdown'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="Markdown preview, Markdown to HTML, Markdown editor, online Markdown" />
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
    "name": "Markdown Previewer",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Live preview",
      "GitHub Flavored Markdown",
      "Syntax highlighting",
      "Auto-save",
      "Split view",
      "HTML output"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <MarkdownTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Markdown Previewer?</h2>
      <p>
        Markdown Previewer is a live editor that renders Markdown text as formatted HTML in real-time.
        Markdown is a lightweight markup language that uses simple syntax to format text. It's widely
        used for documentation, README files, and content creation because it's readable in its raw
        form and converts cleanly to HTML.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Markdown Previewer</h2>
      <ol>
        <li><strong>Write Markdown</strong> - Type or paste your Markdown in the editor</li>
        <li><strong>See live preview</strong> - Watch the formatted output update as you type</li>
        <li><strong>Edit and refine</strong> - Make changes and see results instantly</li>
        <li><strong>Copy HTML</strong> - Get the generated HTML if needed</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Markdown Previewer Features</h2>
      <ul>
        <li><strong>Live preview</strong> - Real-time rendering as you type</li>
        <li><strong>GitHub Flavored Markdown</strong> - Supports tables, task lists, and more</li>
        <li><strong>Syntax highlighting</strong> - Code blocks with language detection</li>
        <li><strong>Auto-save</strong> - Your work is saved automatically</li>
        <li><strong>Split view</strong> - Side-by-side editor and preview</li>
        <li><strong>HTML output</strong> - Copy the generated HTML</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is Markdown used for?</h3>
      <p>
        Markdown is used for writing documentation, README files, blog posts, and any content that
        needs simple formatting. It's the standard format for GitHub documentation, many static site
        generators, and note-taking applications because it's easy to read and write.
      </p>

      <h3>Does this support GitHub Flavored Markdown?</h3>
      <p>
        Yes, this previewer supports GitHub Flavored Markdown (GFM) which includes tables, task lists,
        strikethrough, and fenced code blocks. It also supports syntax highlighting for code blocks
        with language detection.
      </p>

      <h3>Can I export the HTML?</h3>
      <p>
        Yes, you can copy the generated HTML output to use in your projects. The HTML is clean and
        ready to use, though you may want to add your own CSS styling to match your site's design.
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
