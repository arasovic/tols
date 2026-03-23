<script>
  import ColorTool from '$lib/tools/ColorTool.svelte'

  const pageTitle = 'Color Converter - DevUtils | HEX, RGB, HSL Color Tool'
  const pageDescription = 'Free online color converter tool for web developers and designers. Convert instantly between HEX, RGB, and HSL color formats for professional projects.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/color'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="color converter, HEX to RGB, RGB to HSL, color picker, HEX color, RGB color, HSL color, CSS color tool" />
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
    "name": "Color Converter",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "HEX to RGB conversion",
      "RGB to HSL conversion",
      "HEX to HSL conversion",
      "Color picker",
      "CSS color output",
      "Real-time preview"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <ColorTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Color Converter?</h2>
      <p>
        Color Converter is a tool that helps you convert between different color formats used in web
        development and design. It supports HEX (hexadecimal), RGB (Red, Green, Blue), and HSL
        (Hue, Saturation, Lightness) color formats, making it easy to work with colors in CSS,
        HTML, and design applications.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Color Converter</h2>
      <ol>
        <li><strong>Enter a color</strong> - Type a HEX code, RGB values, or HSL values</li>
        <li><strong>See conversions</strong> - All other formats are calculated automatically</li>
        <li><strong>Use the picker</strong> - Click the color input to use the browser color picker</li>
        <li><strong>Copy CSS</strong> - Copy the CSS code for your preferred format</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Color Converter Features</h2>
      <ul>
        <li><strong>Multiple formats</strong> - Convert between HEX, RGB, and HSL</li>
        <li><strong>Color picker</strong> - Use the native browser color picker</li>
        <li><strong>Real-time conversion</strong> - Instant results as you type</li>
        <li><strong>CSS output</strong> - Get ready-to-use CSS color codes</li>
        <li><strong>Color preview</strong> - See your color displayed live</li>
        <li><strong>Auto-save</strong> - Saves your last used color</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is the difference between RGB and HSL?</h3>
      <p>
        RGB defines colors by their red, green, and blue components (0-255 each). HSL uses
        Hue (color wheel position), Saturation (color intensity), and Lightness (brightness).
        HSL is often more intuitive for adjusting colors.
      </p>

      <h3>What is HEX color format?</h3>
      <p>
        HEX (hexadecimal) is a 6-digit code representing RGB values in base-16 format.
        Each pair of digits represents red, green, and blue (00-FF). For example,
        #FF0000 is pure red.
      </p>

      <h3>Which format should I use in CSS?</h3>
      <p>
        All formats work in modern CSS. HEX is compact and widely used. RGB is useful when
        you need to adjust individual channels. HSL is great for programmatic color adjustments
        like lightening or darkening.
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
