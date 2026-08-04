<script>
  import CssFilterTool from '$lib/tools/CssFilterTool.svelte'

  const pageTitle = 'CSS Filter Generator - DevUtils | Apply Visual Filters'
  const pageDescription = 'Free online CSS filter generator tool with visual controls. Create blur, brightness, contrast, and other filter effects with live preview and CSS code output.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/css-filter'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="CSS filter generator, CSS effects, image filters, CSS visual effects" />
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
    "name": "CSS Filter Generator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Visual controls",
      "Live preview",
      "Multiple filters",
      "Drop-shadow editor",
      "CSS output",
      "One-click copy"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <CssFilterTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is CSS Filter Generator?</h2>
      <p>
        CSS Filter Generator is a visual tool for creating CSS filter effects. CSS filters allow you
        to apply graphical effects like blur, brightness, contrast, and more to HTML elements.
        This tool provides an intuitive interface to experiment with filters and generate the
        corresponding CSS code.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use CSS Filter Generator</h2>
      <ol>
        <li><strong>Adjust filters</strong> - Use sliders to modify blur, brightness, contrast, and more</li>
        <li><strong>See live preview</strong> - Watch your changes apply to the sample image in real-time</li>
        <li><strong>Copy CSS</strong> - Copy the generated filter CSS to use in your project</li>
        <li><strong>Reset or combine</strong> - Reset individual filters or combine multiple effects</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">CSS Filter Generator Features</h2>
      <ul>
        <li><strong>Visual controls</strong> - Interactive sliders for all filter properties</li>
        <li><strong>Live preview</strong> - See effects applied instantly</li>
        <li><strong>Multiple filters</strong> - Support for blur, brightness, contrast, grayscale, hue-rotate, invert, saturate, and sepia</li>
        <li><strong>Drop-shadow editor</strong> - Create custom shadow effects with offset, blur, and color</li>
        <li><strong>CSS output</strong> - Get production-ready CSS code</li>
        <li><strong>One-click copy</strong> - Copy the filter CSS instantly</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What browsers support CSS filters?</h3>
      <p>
        CSS filters are supported in all modern browsers including Chrome, Firefox, Safari, and Edge.
        They have excellent support and can be used in production websites. For older browsers,
        the filter property will simply be ignored, and the element will display without effects.
      </p>

      <h3>Can CSS filters be animated?</h3>
      <p>
        Yes, CSS filters can be transitioned and animated using CSS transitions and animations.
        This allows you to create effects like a grayscale image turning to color on hover,
        or a blur effect that clears over time. Animating filters can impact performance,
        so use them judiciously.
      </p>

      <h3>Do filters affect page performance?</h3>
      <p>
        CSS filters can impact rendering performance, especially when applied to large elements
        or when animating. Some filters like blur() are more computationally expensive than
        others like brightness(). For best performance, apply filters to smaller elements
        and avoid animating them on low-end devices.
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
