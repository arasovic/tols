# dev-utilities

Offline-first developer toolkit. 26+ tools, file-based routing, dark mode, zero backend.

Built with SvelteKit + adapter-static. No runtime APIs, no tracking. Everything runs in your browser with static site generation.

Live: [https://arasovic.github.io/dev-utilities/](https://arasovic.github.io/dev-utilities/)

## Tools

### Data

| Route | Tool | Description |
|-------|------|-------------|
| `/json` | JSON Formatter | Format, validate & beautify JSON with syntax highlighting |
| `/yaml` | YAML Formatter | Format, validate, and convert YAML to JSON |
| `/xml` | XML Formatter | Format, validate, and minify XML data |
| `/html` | HTML Formatter | Beautify, minify, and clean HTML |
| `/markdown` | Markdown Previewer | Live preview and convert Markdown to HTML |
| `/regex` | Regex Tester | Test & validate regular expressions with real-time matching |
| `/diff` | Diff Checker | Compare two texts and find differences |
| `/sql` | SQL Formatter | Format and beautify SQL queries |

### Encoding

| Route | Tool | Description |
|-------|------|-------------|
| `/base64` | Base64 | Encode & decode Base64 strings |
| `/url` | URL Encoder | Encode & decode URLs and query parameters |
| `/jwt` | JWT Decoder | Decode and inspect JWT token payload and signatures |
| `/jwt-encoder` | JWT Encoder | Create and sign JWT tokens with HS256 |
| `/jsonp` | JSONP Tester | Simulate JSONP requests and parse responses |

### Generators

| Route | Tool | Description |
|-------|------|-------------|
| `/uuid` | UUID Generator | Generate UUID v4 identifiers |
| `/hash` | Hash Calculator | Calculate MD5, SHA-1, SHA-256, SHA-512 hashes |
| `/lorem` | Lorem Ipsum | Generate placeholder text for mockups |
| `/qrcode` | QR Code | Generate QR codes from text or URLs |
| `/barcode` | Barcode | Generate Code128 barcodes |
| `/password` | Password Generator | Generate secure random passwords |
| `/placeholder` | Image Placeholder | Generate colored placeholder images |

### Converters

| Route | Tool | Description |
|-------|------|-------------|
| `/color` | Color Converter | Convert between HEX, RGB, HSL color formats |
| `/timestamp` | Timestamp | Convert Unix timestamps to readable dates |
| `/timezone` | Time Zone | Convert times between different time zones |
| `/base-converter` | Number Base Converter | Convert between decimal, binary, hex, octal |
| `/cron` | Cron Parser | Validate cron expressions and see next execution times |
| `/unicode` | Unicode Inspector | Explore Unicode characters and their properties |
| `/css` | CSS Formatter | Beautify and minify CSS |

## Keyboard Shortcuts

- **Cmd/Ctrl + K** — Open global search
- **Cmd/Ctrl + B** — Toggle sidebar

## Run locally

```bash
git clone https://github.com/arasovic/dev-utilities.git
cd dev-utilities
npm install
npm run dev
```

## Build

Generate static site for production:

```bash
npm run build
```

Output is in `build/` directory, ready for static hosting.

## Test

```bash
npm run test        # Run tests once
npm run test:watch  # Run tests in watch mode
```

## Stack

SvelteKit, adapter-static, Lucide Svelte, Vitest, plain CSS, Web Crypto API. Static site generation with SEO features (meta tags, sitemap, robots.txt, structured data).

## License

MIT
