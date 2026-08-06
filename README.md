# DevUtils

DevUtils is a collection of 30 developer tools that run entirely in your browser — no backend, no accounts, no tracking.

**Live:** https://tols.arasmehmet.com/

## Features

- Shareable links for 15 of the tools — tool state lives in the URL
- Favorites and recent tools, persisted in your browser
- `⌘K` / `Ctrl+K` to search, `⌘B` / `Ctrl+B` to toggle the sidebar
- Dark mode

## Tools

### Data

[JSON Formatter](https://tols.arasmehmet.com/json) · [YAML Formatter](https://tols.arasmehmet.com/yaml) · [XML Formatter](https://tols.arasmehmet.com/xml) · [HTML Formatter](https://tols.arasmehmet.com/html)
[Markdown Previewer](https://tols.arasmehmet.com/markdown) · [Regex Tester](https://tols.arasmehmet.com/regex) · [Diff Checker](https://tols.arasmehmet.com/diff) · [SQL Formatter](https://tols.arasmehmet.com/sql)

### Encoding

[Base64](https://tols.arasmehmet.com/base64) · [URL Encoder](https://tols.arasmehmet.com/url) · [JWT Decoder](https://tols.arasmehmet.com/jwt) · [JWT Encoder](https://tols.arasmehmet.com/jwt-encoder)
[JSONP Tester](https://tols.arasmehmet.com/jsonp) · [Gzip Calculator](https://tols.arasmehmet.com/gzip) · [Data URI Generator](https://tols.arasmehmet.com/data-uri)

### Generators

[UUID Generator](https://tols.arasmehmet.com/uuid) · [Hash Calculator](https://tols.arasmehmet.com/hash) · [Lorem Ipsum](https://tols.arasmehmet.com/lorem) · [QR Code](https://tols.arasmehmet.com/qrcode)
[Barcode](https://tols.arasmehmet.com/barcode) · [Password Generator](https://tols.arasmehmet.com/password) · [Image Placeholder](https://tols.arasmehmet.com/placeholder)

### Converters

[Color Converter](https://tols.arasmehmet.com/color) · [Timestamp](https://tols.arasmehmet.com/timestamp) · [Time Zone](https://tols.arasmehmet.com/timezone) · [Number Base Converter](https://tols.arasmehmet.com/base-converter)
[Cron Parser](https://tols.arasmehmet.com/cron) · [Unicode Inspector](https://tols.arasmehmet.com/unicode) · [CSS Formatter](https://tols.arasmehmet.com/css) · [CSS Filter Generator](https://tols.arasmehmet.com/css-filter)

## Development

```bash
git clone https://github.com/arasovic/dev-utilities.git
cd dev-utilities
npm install
npm run dev
```

- `npm test` — run the test suite
- `npm run build` — static production build, output in `build/`