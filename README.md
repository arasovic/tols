# DevUtils

DevUtils is a collection of 30 developer tools that run entirely in your browser — no backend, no accounts, no tracking.

**Live:** https://arasovic.github.io/dev-utilities/

## Features

- Shareable links for 15 of the tools — tool state lives in the URL
- Favorites and recent tools, persisted in your browser
- `⌘K` / `Ctrl+K` to search, `⌘B` / `Ctrl+B` to toggle the sidebar
- Dark mode

## Tools

### Data

[JSON Formatter](https://arasovic.github.io/dev-utilities/json) · [YAML Formatter](https://arasovic.github.io/dev-utilities/yaml) · [XML Formatter](https://arasovic.github.io/dev-utilities/xml) · [HTML Formatter](https://arasovic.github.io/dev-utilities/html)
[Markdown Previewer](https://arasovic.github.io/dev-utilities/markdown) · [Regex Tester](https://arasovic.github.io/dev-utilities/regex) · [Diff Checker](https://arasovic.github.io/dev-utilities/diff) · [SQL Formatter](https://arasovic.github.io/dev-utilities/sql)

### Encoding

[Base64](https://arasovic.github.io/dev-utilities/base64) · [URL Encoder](https://arasovic.github.io/dev-utilities/url) · [JWT Decoder](https://arasovic.github.io/dev-utilities/jwt) · [JWT Encoder](https://arasovic.github.io/dev-utilities/jwt-encoder)
[JSONP Tester](https://arasovic.github.io/dev-utilities/jsonp) · [Gzip Calculator](https://arasovic.github.io/dev-utilities/gzip) · [Data URI Generator](https://arasovic.github.io/dev-utilities/data-uri)

### Generators

[UUID Generator](https://arasovic.github.io/dev-utilities/uuid) · [Hash Calculator](https://arasovic.github.io/dev-utilities/hash) · [Lorem Ipsum](https://arasovic.github.io/dev-utilities/lorem) · [QR Code](https://arasovic.github.io/dev-utilities/qrcode)
[Barcode](https://arasovic.github.io/dev-utilities/barcode) · [Password Generator](https://arasovic.github.io/dev-utilities/password) · [Image Placeholder](https://arasovic.github.io/dev-utilities/placeholder)

### Converters

[Color Converter](https://arasovic.github.io/dev-utilities/color) · [Timestamp](https://arasovic.github.io/dev-utilities/timestamp) · [Time Zone](https://arasovic.github.io/dev-utilities/timezone) · [Number Base Converter](https://arasovic.github.io/dev-utilities/base-converter)
[Cron Parser](https://arasovic.github.io/dev-utilities/cron) · [Unicode Inspector](https://arasovic.github.io/dev-utilities/unicode) · [CSS Formatter](https://arasovic.github.io/dev-utilities/css) · [CSS Filter Generator](https://arasovic.github.io/dev-utilities/css-filter)

## Development

```bash
git clone https://github.com/arasovic/dev-utilities.git
cd dev-utilities
npm install
npm run dev
```

- `npm test` — run the test suite
- `npm run build` — static production build, output in `build/`