/**
 * Per-tool SEO metadata for the static <head>, keyed by tool id.
 *
 * Extracted verbatim from the 30 tool pages when they collapsed into the
 * single [tool] route. Every string here is byte-for-byte what a crawler
 * saw before the collapse; the head is rendered from this map and nothing
 * is normalised or rewritten. The keys pageTitle, pageDescription,
 * canonicalUrl, ogImage, keywords, name and featureList feed the template
 * in (app)/[tool]/+page.svelte (the JSON-LD name and featureList, the
 * canonical/og:url, and the description are interpolated into the block).
 *
 * @typedef {Object} SeoTool
 * @property {string} pageTitle
 * @property {string} pageDescription
 * @property {string} canonicalUrl
 * @property {string} ogImage
 * @property {string} keywords
 * @property {string} name
 * @property {string[]} featureList
 */
/** @type {Record<string, SeoTool>} */
export const seo = {
  "barcode": {
    pageTitle: "Barcode Generator - tols | Create Barcodes",
    pageDescription: "Free online barcode generator tool. Create Code128 barcodes instantly for products, labels, inventory management, and retail business purposes online today.",
    canonicalUrl: "https://tols.arasmehmet.com/barcode",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "barcode generator, Code128, barcode creator, free barcode",
    name: "Barcode Generator",
    featureList: ["Code 128 support","Real-time generation","Customizable size","Display options","PNG download","Print ready"]
  },
  "base-converter": {
    pageTitle: "Number Base Converter - tols | Decimal Binary Hex",
    pageDescription: "Free online number base converter tool for developers. Convert between decimal, binary, hexadecimal, and octal number systems instantly with full support.",
    canonicalUrl: "https://tols.arasmehmet.com/base-converter",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "base converter, decimal to binary, hex converter, octal converter",
    name: "Number Base Converter",
    featureList: ["Four bases","Real-time conversion","Input validation","Prefix options","One-click copy","Large numbers"]
  },
  "base64": {
    pageTitle: "Base64 Encoder/Decoder - tols | Online Base64 Converter",
    pageDescription: "Free online Base64 encoder and decoder tool for developers. Encode and decode Base64 text instantly with full UTF-8 support for web development projects.",
    canonicalUrl: "https://tols.arasmehmet.com/base64",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "Base64 encoder, Base64 decoder, Base64 converter, online Base64, encode Base64, decode Base64, URL-safe Base64",
    name: "Base64 Encoder/Decoder",
    featureList: ["Encode text to Base64","Decode Base64 to text","URL-safe Base64 encoding","Real-time conversion","Copy to clipboard","Auto-save input"]
  },
  "color": {
    pageTitle: "Color Converter - tols | HEX, RGB, HSL Color Tool",
    pageDescription: "Free online color converter tool for web developers and designers. Convert instantly between HEX, RGB, and HSL color formats for professional projects.",
    canonicalUrl: "https://tols.arasmehmet.com/color",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "color converter, HEX to RGB, RGB to HSL, color picker, HEX color, RGB color, HSL color, CSS color tool",
    name: "Color Converter",
    featureList: ["HEX to RGB conversion","RGB to HSL conversion","HEX to HSL conversion","Color picker","CSS color output","Real-time preview"]
  },
  "cron": {
    pageTitle: "Cron Expression Parser - tols | Validate & Parse Cron",
    pageDescription: "Free online cron expression parser tool for developers. Validate cron syntax instantly, get human descriptions, and calculate next execution times online.",
    canonicalUrl: "https://tols.arasmehmet.com/cron",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "cron parser, cron validator, cron expression, crontab, schedule parser",
    name: "Cron Expression Parser",
    featureList: ["Human-readable description","Next execution times","Syntax validation","Standard cron support","Common presets","Real-time parsing"]
  },
  "css": {
    pageTitle: "CSS Formatter - tols | CSS Beautifier & Minifier",
    pageDescription: "Free online CSS formatter and optimizer tool for web developers. Beautify and minify CSS code instantly with proper indentation and whitespace optimization.",
    canonicalUrl: "https://tols.arasmehmet.com/css",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "CSS formatter, CSS beautifier, CSS minifier, online CSS tool",
    name: "CSS Formatter",
    featureList: ["Beautify CSS","Minify CSS","Syntax preservation","Real-time preview","One-click copy","Error detection"]
  },
  "css-filter": {
    pageTitle: "CSS Filter Generator - tols | Apply Visual Filters",
    pageDescription: "Free online CSS filter generator tool with visual controls. Create blur, brightness, contrast, and other filter effects with live preview and CSS code output.",
    canonicalUrl: "https://tols.arasmehmet.com/css-filter",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "CSS filter generator, CSS effects, image filters, CSS visual effects",
    name: "CSS Filter Generator",
    featureList: ["Visual controls","Live preview","Multiple filters","Drop-shadow editor","CSS output","One-click copy"]
  },
  "data-uri": {
    pageTitle: "Data URI Generator - tols | Convert Files to Data URIs",
    pageDescription: "Convert files to Data URIs for inline embedding in web projects instantly. Supports images, fonts, and other file types with automatic MIME type detection.",
    canonicalUrl: "https://tols.arasmehmet.com/data-uri",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "Data URI generator, base64 encoder, inline image, data URL, file to base64",
    name: "Data URI Generator",
    featureList: ["Drag and drop","Multiple formats","Automatic MIME type","Size display","CSS ready","One-click copy"]
  },
  "diff": {
    pageTitle: "Diff Checker - tols | Compare Text Differences",
    pageDescription: "Free online diff checker comparison tool for developers. Compare two texts side-by-side instantly, find differences, and see unified diff output online today.",
    canonicalUrl: "https://tols.arasmehmet.com/diff",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "diff checker, text compare, difference finder, unified diff",
    name: "Diff Checker",
    featureList: ["Side-by-side view","Unified diff","Line-by-line comparison","Color highlighting","Word-level diff","Clear inputs"]
  },
  "gzip": {
    pageTitle: "Gzip Calculator - tols | Estimate Compression Size",
    pageDescription: "Free online Gzip compression calculator tool for web developers. Estimate gzip compression size and analyze bandwidth savings for content optimization.",
    canonicalUrl: "https://tols.arasmehmet.com/gzip",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "gzip calculator, compression ratio, gzip compression, file size estimator",
    name: "Gzip Calculator",
    featureList: ["Size estimation","Compression ratio","Real-time calculation","Byte-level precision","Multiple formats","Performance insights"]
  },
  "hash": {
    pageTitle: "Hash Calculator - tols | Online MD5, SHA Generator",
    pageDescription: "Calculate cryptographic hashes online. Generate MD5, SHA-1, SHA-256, SHA-512 hashes instantly. Free hash calculator for developers and security professionals.",
    canonicalUrl: "https://tols.arasmehmet.com/hash",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "hash calculator, MD5 generator, SHA-256, SHA-1, SHA-512, online hash, cryptographic hash, checksum generator",
    name: "Hash Calculator",
    featureList: ["MD5 hash calculation","SHA-1 hash calculation","SHA-256 hash calculation","SHA-512 hash calculation","Real-time computation","Copy hash to clipboard"]
  },
  "html": {
    pageTitle: "HTML Formatter - tols | HTML Beautifier & Minifier",
    pageDescription: "Free online HTML formatter and optimizer tool for developers. Beautify and minify HTML code instantly with comment removal, attribute quoting, and formatting.",
    canonicalUrl: "https://tols.arasmehmet.com/html",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "HTML formatter, HTML beautifier, HTML minifier, online HTML tool",
    name: "HTML Formatter",
    featureList: ["Beautify HTML","Minify HTML","Attribute sorting","Quote normalization","One-click copy","Auto-save"]
  },
  "json": {
    pageTitle: "JSON Formatter - tols | Online JSON Validator & Beautifier",
    pageDescription: "Free online JSON formatter, validator, and minifier. Format, validate, and beautify JSON data instantly with syntax error highlighting support included.",
    canonicalUrl: "https://tols.arasmehmet.com/json",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "JSON formatter, JSON validator, JSON beautifier, JSON minifier, JSON parser, online JSON tool, format JSON, validate JSON",
    name: "JSON Formatter",
    featureList: ["Format and beautify JSON","Minify JSON for production","Validate JSON syntax","Error detection with line numbers","Syntax highlighting","Copy formatted output"]
  },
  "jsonp": {
    pageTitle: "JSONP Tester - tols | JSONP Request Simulator",
    pageDescription: "Free online JSONP tester tool for developers. Simulate JSONP requests and parse responses instantly with full callback function support for cross-domain.",
    canonicalUrl: "https://tols.arasmehmet.com/jsonp",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "JSONP tester, JSONP simulator, JSONP request, cross-origin JSON",
    name: "JSONP Tester",
    featureList: ["Cross-domain testing","Custom callback","Response formatting","Error handling","Request history","Query parameter support"]
  },
  "jwt": {
    pageTitle: "JWT Decoder - tols | Online JSON Web Token Inspector",
    pageDescription: "Free online JWT decoder tool for web developers. Decode JSON Web Tokens instantly to view header, payload, and verify token signatures for debugging now.",
    canonicalUrl: "https://tols.arasmehmet.com/jwt",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "JWT decoder, JWT debugger, JSON Web Token, JWT inspector, decode JWT, JWT parser, online JWT tool",
    name: "JWT Decoder",
    featureList: ["Decode JWT header","Decode JWT payload","Pretty-print JSON","Token validation","Base64 URL decoding","Copy decoded parts"]
  },
  "jwt-encoder": {
    pageTitle: "JWT Encoder - tols | Create and Sign JWT Tokens",
    pageDescription: "Free online JWT encoder tool for web developers. Create and sign JSON Web Tokens instantly with HS256 algorithm for securely signing web app authentication.",
    canonicalUrl: "https://tols.arasmehmet.com/jwt-encoder",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "JWT encoder, JWT signer, create JWT, HS256, JWT token generator",
    name: "JWT Encoder",
    featureList: ["HS256 signing","Custom headers","Flexible payload","Real-time preview","One-click copy","Validation"]
  },
  "lorem": {
    pageTitle: "Lorem Ipsum Generator - tols | Free Placeholder Text",
    pageDescription: "Generate Lorem Ipsum placeholder text for your designs and mockups. Customize word count, paragraphs, and HTML output. Free online dummy text generator.",
    canonicalUrl: "https://tols.arasmehmet.com/lorem",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "Lorem Ipsum generator, placeholder text, dummy text, lorem generator, placeholder content, mockup text",
    name: "Lorem Ipsum Generator",
    featureList: ["Generate paragraphs","Generate sentences","Generate words","Custom word count","HTML output option","One-click copy"]
  },
  "markdown": {
    pageTitle: "Markdown Previewer - tols | Live Markdown Preview",
    pageDescription: "Free online Markdown previewer and converter tool for web developers. Live preview and convert Markdown to HTML with syntax highlighting support included.",
    canonicalUrl: "https://tols.arasmehmet.com/markdown",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "Markdown preview, Markdown to HTML, Markdown editor, online Markdown",
    name: "Markdown Previewer",
    featureList: ["Live preview","GitHub Flavored Markdown","Syntax highlighting","Auto-save","Split view","HTML output"]
  },
  "password": {
    pageTitle: "Password Generator - tols | Secure Password Creator",
    pageDescription: "Generate secure, random passwords with customizable options. Includes strength analysis and entropy calculation for maximum security for your accounts.",
    canonicalUrl: "https://tols.arasmehmet.com/password",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "password generator, secure password, random password, strong password",
    name: "Password Generator",
    featureList: ["Customizable password length","Character type selection","Entropy calculation","Strength indicator","Secure random generation","One-click copy"]
  },
  "placeholder": {
    pageTitle: "Image Placeholder - tols | Generate Placeholder Images",
    pageDescription: "Free online placeholder image generator tool for designers. Create colored placeholder images instantly for mockups, prototypes, and website design projects.",
    canonicalUrl: "https://tols.arasmehmet.com/placeholder",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "placeholder image, image placeholder, mockup image generator",
    name: "Image Placeholder Generator",
    featureList: ["Custom dimensions","Color selection","Custom text","PNG output","Instant generation","Copy URL"]
  },
  "qrcode": {
    pageTitle: "QR Code Generator - tols | Free QR Code Creator",
    pageDescription: "Free online QR code generator tool for everyone. Create QR codes from text and URLs instantly with size controls, error correction, and download options.",
    canonicalUrl: "https://tols.arasmehmet.com/qrcode",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "QR code generator, QR code creator, free QR code, online QR code",
    name: "QR Code Generator",
    featureList: ["Multiple formats","Error correction","Customizable size","PNG and SVG output","Real-time generation","High quality"]
  },
  "regex": {
    pageTitle: "Regex Tester - tols | Online Regular Expression Tool",
    pageDescription: "Test and debug regular expressions online. Match, replace, and split with regex. Real-time pattern matching with highlighted matches. Free regex tester tool.",
    canonicalUrl: "https://tols.arasmehmet.com/regex",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "regex tester, regular expression, regex debugger, pattern matching, regex online, regex validator, regex tool",
    name: "Regex Tester",
    featureList: ["Real-time pattern matching","Match highlighting","Replace functionality","Split testing","Flag support (g, i, m)","Error detection"]
  },
  "sql": {
    pageTitle: "SQL Formatter - tols | SQL Beautifier",
    pageDescription: "Free online SQL formatter and beautifier tool for developers. Format SQL queries instantly with proper indentation, keyword casing, and readable output.",
    canonicalUrl: "https://tols.arasmehmet.com/sql",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "SQL formatter, SQL beautifier, SQL minifier, online SQL tool",
    name: "SQL Formatter",
    featureList: ["Standard formatting","Keyword capitalization","Multiple dialects","Query validation","One-click copy","Auto-save"]
  },
  "timestamp": {
    pageTitle: "Timestamp Converter - tols | Unix Timestamp to Date",
    pageDescription: "Free online timestamp converter tool for developers. Convert Unix timestamps to human-readable dates and times instantly with full timezone support online.",
    canonicalUrl: "https://tols.arasmehmet.com/timestamp",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "timestamp converter, Unix timestamp, epoch time, timestamp to date, date to timestamp, online timestamp tool",
    name: "Timestamp Converter",
    featureList: ["Unix timestamp to date","Date to Unix timestamp","Millisecond support","Multiple timezone support","Current timestamp","ISO 8601 output"]
  },
  "timezone": {
    pageTitle: "Time Zone Converter - tols | Convert Time Zones",
    pageDescription: "Free online time zone converter tool for scheduling. Convert times instantly between different time zones worldwide with automatic daylight saving support.",
    canonicalUrl: "https://tols.arasmehmet.com/timezone",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "time zone converter, timezone converter, UTC converter, world time",
    name: "Time Zone Converter",
    featureList: ["Global coverage","Daylight saving","Current time","Time difference","Date support","Multiple formats"]
  },
  "unicode": {
    pageTitle: "Unicode Inspector - tols | Explore Unicode Characters",
    pageDescription: "Free online Unicode inspector tool for developers. Explore Unicode characters, codepoints, categories, and special symbols instantly with search included.",
    canonicalUrl: "https://tols.arasmehmet.com/unicode",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "Unicode inspector, Unicode characters, codepoint lookup, Unicode search",
    name: "Unicode Inspector",
    featureList: ["Character details","Block information","Escape sequences","Multi-character analysis","Search functionality","One-click copy"]
  },
  "url": {
    pageTitle: "URL Encoder/Decoder - tols | Online URL Converter",
    pageDescription: "Free online URL encoder and decoder tool for web developers. Encode and decode URL components instantly with full character support for all development.",
    canonicalUrl: "https://tols.arasmehmet.com/url",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "URL encoder, URL decoder, URL converter, percent encoding, URL escape, online URL tool, encode URL, decode URL",
    name: "URL Encoder/Decoder",
    featureList: ["Encode URLs to percent-encoded format","Decode percent-encoded URLs","Full URL encoding support","Special character handling","Real-time conversion","Copy to clipboard"]
  },
  "uuid": {
    pageTitle: "UUID Generator - tols | Free UUID v4 Generator",
    pageDescription: "Free online UUID generator tool for web developers. Create version 4 UUIDs instantly for unique identifiers in databases and distributed software apps.",
    canonicalUrl: "https://tols.arasmehmet.com/uuid",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "UUID generator, UUID v4, GUID generator, generate UUID, online UUID, bulk UUID, unique identifier",
    name: "UUID Generator",
    featureList: ["Generate UUID v4","Bulk UUID generation (up to 100)","Cryptographically secure random generation","One-click copy","Generate multiple formats","Auto-save preferences"]
  },
  "xml": {
    pageTitle: "XML Formatter - tols | XML Beautifier & Validator",
    pageDescription: "Free online XML formatter and validator tool for developers. Format, validate, and minify XML data instantly with CDATA, comment, and syntax support online.",
    canonicalUrl: "https://tols.arasmehmet.com/xml",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "XML formatter, XML validator, XML beautifier, online XML tool",
    name: "XML Formatter",
    featureList: ["Prettify XML","Minify XML","Validation","Error highlighting","Syntax highlighting","One-click copy"]
  },
  "yaml": {
    pageTitle: "YAML Formatter - tols | Online YAML Validator & Converter",
    pageDescription: "Free online YAML formatter and validator tool. Format, validate, and convert YAML to JSON instantly with full nested structure and array support included.",
    canonicalUrl: "https://tols.arasmehmet.com/yaml",
    ogImage: "https://tols.arasmehmet.com/og-image.png",
    keywords: "YAML formatter, YAML validator, YAML to JSON, JSON to YAML, online YAML tool",
    name: "YAML Formatter",
    featureList: ["Real-time validation","Prettify mode","Minify mode","YAML to JSON","JSON to YAML","Error highlighting"]
  },
}
