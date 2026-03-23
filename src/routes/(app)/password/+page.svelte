<script>
  import PasswordTool from '$lib/tools/PasswordTool.svelte'

  const pageTitle = 'Password Generator - DevUtils | Secure Password Creator'
  const pageDescription = 'Generate secure, random passwords with customizable options. Includes strength analysis and entropy calculation for maximum security for your accounts.'
  const canonicalUrl = 'https://arasovic.github.io/dev-utilities/password'
  const ogImage = 'https://arasovic.github.io/dev-utilities/og-image.svg'
</script>

<svelte:head>
  <title>{pageTitle}</title>
  <meta name="description" content={pageDescription} />
  <meta name="keywords" content="password generator, secure password, random password, strong password" />
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
    "name": "Password Generator",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "description": pageDescription,
    "featureList": [
      "Customizable password length",
      "Character type selection",
      "Entropy calculation",
      "Strength indicator",
      "Secure random generation",
      "One-click copy"
    ],
    "url": canonicalUrl,
    "provider": { "@type": "Organization", "name": "DevUtils", "url": "https://arasovic.github.io/dev-utilities" }
  })}</script>`}
</svelte:head>

<main id="main-content">
  <article>
    <PasswordTool />

    <div class="seo-section">
    <section class="seo-content" aria-labelledby="what-is">
      <h2 id="what-is">What is Password Generator?</h2>
      <p>
        Password Generator creates strong, secure random passwords for your accounts and applications.
        It uses cryptographically secure random number generation to ensure passwords are truly random
        and unpredictable. The tool includes an entropy calculator to help you understand password strength.
      </p>
    </section>

    <section class="seo-content" aria-labelledby="how-to-use">
      <h2 id="how-to-use">How to Use Password Generator</h2>
      <ol>
        <li><strong>Set length</strong> - Choose a password length (recommended: 16+ characters)</li>
        <li><strong>Select character types</strong> - Enable uppercase, lowercase, numbers, and symbols</li>
        <li><strong>Generate</strong> - Click generate to create a new secure password</li>
        <li><strong>Check entropy</strong> - Review the entropy score to ensure strong security</li>
        <li><strong>Copy and use</strong> - Copy the password to your clipboard</li>
      </ol>
    </section>

    <section class="seo-content" aria-labelledby="features">
      <h2 id="features">Password Generator Features</h2>
      <ul>
        <li><strong>Customizable length</strong> - Generate passwords from 8 to 128 characters</li>
        <li><strong>Character options</strong> - Include/exclude uppercase, lowercase, numbers, symbols</li>
        <li><strong>Entropy calculation</strong> - Shows password strength in bits of entropy</li>
        <li><strong>Strength indicator</strong> - Visual feedback on password strength</li>
        <li><strong>Secure generation</strong> - Uses browser's crypto API for randomness</li>
        <li><strong>One-click copy</strong> - Copy password instantly to clipboard</li>
      </ul>
    </section>

    <section class="seo-content" aria-labelledby="faq">
      <h2 id="faq">Frequently Asked Questions</h2>

      <h3>What is password entropy?</h3>
      <p>
        Password entropy measures the randomness of a password in bits. Higher entropy means a password
        is more difficult to guess or crack through brute force. We recommend passwords with at least
        60 bits of entropy for good security, and 80+ bits for high-security applications.
      </p>

      <h3>Are the generated passwords truly random?</h3>
      <p>
        Yes, this tool uses the Web Crypto API's cryptographically secure random number generator,
        which provides truly random values suitable for security purposes. This is much more secure
        than standard pseudo-random number generators.
      </p>

      <h3>Is it safe to use an online password generator?</h3>
      <p>
        This password generator runs entirely in your browser. Passwords are generated locally and
        never sent to any server. However, for maximum security, you should always use a reputable
        password manager to store your passwords rather than copying them to unencrypted storage.
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
