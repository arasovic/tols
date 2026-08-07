# tols

One CLI, with no runtime dependencies. Format, encode,
hash, generate and convert, from the shell or from a pipe.

```sh
tols json fmt @config.json
tols b64 enc "hello" | tols b64 dec
tols qr gen "https://example.com"
tols hash sha256 <<< "secret"
```

- No runtime dependencies. Node >= 20, ESM only.
- Results go to stdout and diagnostics to stderr, so commands pipe cleanly.
- `--json` works on every command and returns `{"ok":true,"result":...}`.
- Every core module is importable: `import { base64, json } from 'tols-cli'`.

## Install

```sh
npm install -g tols-cli   # global CLI, installs the `tols` command
npm install tols-cli      # or just this project
```

Run without installing: `npx tols-cli <tool> <action> [input] [flags]`.

## Usage

```
tols <tool> <action> [input] [flags]
tols <tool> help
tols help
```

Input comes from a positional argument, piped stdin, or `@<file>`
(one trailing newline is stripped, so files and pipes behave the same).
Exit codes: `0` success, `1` tool error, `2` usage error.

## Tools

| Tool | Actions (default in bold) |
|---|---|
| `base64` (b64) | **enc**, dec |
| `url` | **enc**, dec, analyze |
| `json` (js) | **fmt**, min, val |
| `yaml` (yml) | **fmt**, json, min |
| `diff` | **run** |
| `timestamp` (ts) | now, **conv**, parse |
| `cron` (cr) | **parse**, next, val |
| `uuid` (id) | **gen** |
| `hash` (hs) | md5, sha1, **sha256**, sha512 |
| `jwt` | **dec**, enc |
| `gzip` (gz) | **comp**, decomp |
| `base` | **conv** |
| `password` (pw) | **gen** |
| `unicode` (uni) | **info**, search |
| `timezone` (tz) | **conv**, zones |
| `color` (clr) | **conv** |
| `cssfilter` | **gen** |
| `datauri` (duri) | **enc**, dec |
| `placeholder` (ph) | **gen** |
| `lorem` | **gen** |
| `jsonp` | **wrap**, script |
| `css` | **fmt**, min |
| `html` | **fmt**, min |
| `xml` | **fmt**, min, val |
| `sql` | **fmt**, min |
| `markdown` (md) | **html** |
| `regex` (re) | **match**, replace |
| `qrcode` (qr) | **gen** |
| `barcode` (bc) | **gen** |

Each tool documents its own flags: `tols <tool> help`.

## Examples

```sh
# Formatting & validation
tols json fmt @data.json
tols sql fmt --keyword-case=lower @query.sql
tols xml val @doc.xml || echo "broken xml"

# Encoding round-trips
tols gzip comp @app.js --json     # -> { base64, originalBytes, compressedBytes, ratio }
tols gzip decomp H4sIA... | less
tols duri enc ./logo.png          # -> data:image/png;base64,...
tols duri dec "data:image/png;base64,..." > logo.png

# Generators
tols uuid gen
tols pw gen --length=24 --symbols
tols qr gen "https://example.com" --ascii
tols bc gen "ABC-123" > barcode.svg
tols ph gen --width=800 --height=400 --text="Coming soon" > placeholder.svg

# Conversion
tols base conv 0xff --to=bin      # 11111111
tols color conv "#ff6b35"
tols tz conv "2026-08-05 14:00" --from=Europe/Istanbul --to=America/New_York
tols md html @notes.md > notes.html
```

## Programmatic API

```js
import { base64, color, cron } from 'tols-cli';

base64.encode('hello');            // 'aGVsbG8='
color.parse('#ff6b35');            // { rgb, hsl, hex, rgbString, hslString }
cron.parse('*/5 * * * *');         // field breakdown

// Individual modules without the CLI registry:
import { gzip } from 'tols-cli/core/gzip.js';
```

All core modules are browser-safe (no Node-only APIs, no `Buffer`), so the
same code runs in the CLI and in a browser bundle.

## Notes & limitations

- `qrcode`: spec-complete encoder (versions 1-40, EC levels L/M/Q/H via
  `--ec`, automatic mask selection). Verified end-to-end with a decoder
  in the test suite.
- `xml val`: structural validation (tag balance, unclosed constructs).
  The web tool uses DOMParser for full parse checking.
- `regex`: runs synchronously; pathological patterns can block (the web
  sandboxed them in a Worker with a 5s timeout).
- `html` / `xml`: hand-rolled tag scanner; a `>` inside a quoted
  attribute value ends the tag.
- `yaml`: pragmatic subset parser. Anchors/aliases/tags are rejected
  with an error. Top-level sequences and scalars, nested/chained
  sequences (`- - x`), quoted-scalar escapes (`\"`, `\\`, `''`),
  folded scalars (`>`) and chomping indicators (`|-`, `|+`) are
  supported; default block-scalar chomping drops the final trailing
  newline (pyyaml keeps one). Invalid YAML that pyyaml rejects (e.g.
  `key: - item`) may parse leniently.
- `cron`: 5-field expressions; `?` is accepted only in the
  day-of-month / day-of-week fields and `7` is an alias for Sunday.
- `diff`: Myers with full trace is quadratic, so inputs above ~3500
  lines per side are rejected with an error instead of exhausting
  memory.
- `placeholder`: emits SVG. The web tool draws a canvas PNG instead, so
  the options are the same but the output format differs.

## Development

```sh
npm test            # vitest, unit + CLI contract tests
```

The core lives in `src/core/*.js` (pure, browser-safe), CLI adapters in
`src/tools/*.js`, the dispatcher in `src/cli.js`. Tests: `test/unit`
(core behavior) and `test/tools` (spawned-CLI contract).

## License

MIT
