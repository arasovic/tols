# tols

[![Deploy](https://github.com/arasovic/tols/actions/workflows/deploy.yml/badge.svg)](https://github.com/arasovic/tols/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Developer tools, available both as a website and as a command line
program. The web version runs entirely in your browser: there is no backend, no
account, and nothing is sent anywhere. The CLI has no runtime dependencies.

- **Web:** [tols.arasmehmet.com](https://tols.arasmehmet.com/)
- **CLI:** `npm install -g tols-cli`

Each web page shows the CLI command that does the same job, so anything you can
do on the site you can also put in a script.

```sh
tols json fmt @config.json
tols b64 enc "hello" | tols b64 dec
tols hash sha256 <<< "secret"
```

## Tools

### Data

| Tool | What it does | CLI |
|---|---|---|
| [JSON Formatter](https://tols.arasmehmet.com/json) | Format, validate and beautify JSON | `tols json fmt` |
| [YAML Formatter](https://tols.arasmehmet.com/yaml) | Format YAML and convert it to JSON | `tols yaml fmt` |
| [XML Formatter](https://tols.arasmehmet.com/xml) | Format, validate and minify XML | `tols xml fmt` |
| [HTML Formatter](https://tols.arasmehmet.com/html) | Beautify and minify HTML | `tols html fmt` |
| [Markdown Previewer](https://tols.arasmehmet.com/markdown) | Preview Markdown and convert it to HTML | `tols markdown html` |
| [Regex Tester](https://tols.arasmehmet.com/regex) | Test regular expressions against sample text | `tols regex match` |
| [Diff Checker](https://tols.arasmehmet.com/diff) | Compare two texts with word level precision | `tols diff` |
| [SQL Formatter](https://tols.arasmehmet.com/sql) | Format and beautify SQL queries | `tols sql fmt` |

### Encoding

| Tool | What it does | CLI |
|---|---|---|
| [Base64](https://tols.arasmehmet.com/base64) | Encode and decode Base64 | `tols base64 enc` |
| [URL Encoder](https://tols.arasmehmet.com/url) | Encode and decode URLs and query parameters | `tols url enc` |
| [JWT Decoder](https://tols.arasmehmet.com/jwt) | Inspect a token's header, payload and signature | `tols jwt dec` |
| [JWT Encoder](https://tols.arasmehmet.com/jwt-encoder) | Create and sign a token with HS256 | `tols jwt enc` |
| [JSONP Tester](https://tols.arasmehmet.com/jsonp) | Wrap a payload in a JSONP callback | `tols jsonp wrap` |
| [Gzip Calculator](https://tols.arasmehmet.com/gzip) | Measure how far a payload compresses | `tols gzip comp` |
| [Data URI Generator](https://tols.arasmehmet.com/data-uri) | Turn a file into a data URI | `tols datauri enc` |

### Generators

| Tool | What it does | CLI |
|---|---|---|
| [UUID Generator](https://tols.arasmehmet.com/uuid) | Generate UUID v4 identifiers | `tols uuid gen` |
| [Hash Calculator](https://tols.arasmehmet.com/hash) | MD5, SHA-1, SHA-256 and SHA-512 | `tols hash sha256` |
| [Lorem Ipsum](https://tols.arasmehmet.com/lorem) | Generate placeholder text | `tols lorem gen` |
| [QR Code](https://tols.arasmehmet.com/qrcode) | Generate QR codes from text or a URL | `tols qr gen` |
| [Barcode](https://tols.arasmehmet.com/barcode) | Generate Code128 barcodes | `tols barcode gen` |
| [Password Generator](https://tols.arasmehmet.com/password) | Generate passwords and show their entropy | `tols password gen` |
| [Image Placeholder](https://tols.arasmehmet.com/placeholder) | Generate placeholder images | `tols placeholder gen` |

### Converters

| Tool | What it does | CLI |
|---|---|---|
| [Color Converter](https://tols.arasmehmet.com/color) | Convert between HEX, RGB and HSL | `tols color conv` |
| [Timestamp](https://tols.arasmehmet.com/timestamp) | Convert Unix timestamps to readable dates | `tols timestamp conv` |
| [Time Zone](https://tols.arasmehmet.com/timezone) | Convert a time between zones | `tols timezone conv` |
| [Number Base](https://tols.arasmehmet.com/base-converter) | Convert between decimal, binary, hex and octal | `tols base conv` |
| [Cron Parser](https://tols.arasmehmet.com/cron) | Explain an expression and list its next runs | `tols cron parse` |
| [Unicode Inspector](https://tols.arasmehmet.com/unicode) | Look up characters and their properties | `tols unicode info` |
| [CSS Formatter](https://tols.arasmehmet.com/css) | Beautify and minify CSS | `tols css fmt` |
| [CSS Filter Generator](https://tols.arasmehmet.com/css-filter) | Build a CSS filter chain visually | `tols cssfilter gen` |

Run `tols <tool> help` for a tool's flags, or `tols help` for the full list.

## Web features

- Shareable links for 15 of the tools, with the tool's state encoded in the URL
- Favourites and recent tools, kept in your browser
- `⌘K` to search, `⌘B` to toggle the sidebar
- Light and dark themes

## Repository layout

```
apps/web         SvelteKit site, static build, deployed to GitHub Pages
packages/tols    the CLI and the shared core, published to npm
```

The core lives in `packages/tols/src/core/`. Those modules use no Node specific
APIs, so the same files are imported by the CLI and bundled into the site. The
CLI adapters in `packages/tols/src/tools/` wrap them in argument parsing, and
the Svelte components in `apps/web/src/lib/tools/` wrap them in a UI.

That consolidation is partway done: 11 of the 30 web tools import the shared
core today, and the other 19 still carry their own implementation next to the
CLI's. Moving one onto the core is a good first contribution. Markdown is the
worked example of why it is worth doing: both copies had drifted into the same
paragraph bug, and each had to be fixed separately.

## Development

```sh
git clone https://github.com/arasovic/tols.git
cd tols
npm install
npm run dev
```

| Command | Effect |
|---|---|
| `npm run dev` | Start the site on a local dev server |
| `npm test` | Run both test suites, over 1,600 tests |
| `npm run check` | Type check the Svelte app with svelte-check |
| `npm run build` | Static production build into `apps/web/build/` |

Every push to `main` runs the tests, the type check and the build before
deploying, so a red suite never reaches the site.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Bug reports and new tools are both
welcome; a new tool is one registry entry, one route and one core module.

## License

MIT, see [LICENSE](LICENSE).
