/**
 * Unicode analysis shared by the zero-dependency CLI and browser surfaces.
 */

export const COMMON_CHARS = [
  { char: '©', name: 'Copyright Sign', category: 'Symbol', codepoint: 'U+00A9' },
  { char: '®', name: 'Registered Sign', category: 'Symbol', codepoint: 'U+00AE' },
  { char: '™', name: 'Trade Mark Sign', category: 'Symbol', codepoint: 'U+2122' },
  { char: '°', name: 'Degree Sign', category: 'Symbol', codepoint: 'U+00B0' },
  { char: '±', name: 'Plus-Minus Sign', category: 'Symbol', codepoint: 'U+00B1' },
  { char: '×', name: 'Multiplication Sign', category: 'Math', codepoint: 'U+00D7' },
  { char: '÷', name: 'Division Sign', category: 'Math', codepoint: 'U+00F7' },
  { char: '→', name: 'Right Arrow', category: 'Arrow', codepoint: 'U+2192' },
  { char: '←', name: 'Left Arrow', category: 'Arrow', codepoint: 'U+2190' },
  { char: '↑', name: 'Up Arrow', category: 'Arrow', codepoint: 'U+2191' },
  { char: '↓', name: 'Down Arrow', category: 'Arrow', codepoint: 'U+2193' },
  { char: '•', name: 'Bullet', category: 'Punctuation', codepoint: 'U+2022' },
  { char: '…', name: 'Horizontal Ellipsis', category: 'Punctuation', codepoint: 'U+2026' },
  { char: '—', name: 'Em Dash', category: 'Punctuation', codepoint: 'U+2014' },
  { char: '–', name: 'En Dash', category: 'Punctuation', codepoint: 'U+2013' },
  { char: '€', name: 'Euro Sign', category: 'Currency', codepoint: 'U+20AC' },
  { char: '£', name: 'Pound Sign', category: 'Currency', codepoint: 'U+00A3' },
  { char: '¥', name: 'Yen Sign', category: 'Currency', codepoint: 'U+00A5' },
  { char: '√', name: 'Square Root', category: 'Math', codepoint: 'U+221A' },
  { char: '∞', name: 'Infinity', category: 'Math', codepoint: 'U+221E' },
  { char: '≈', name: 'Almost Equal', category: 'Math', codepoint: 'U+2248' },
  { char: '≠', name: 'Not Equal', category: 'Math', codepoint: 'U+2260' },
  { char: '≤', name: 'Less-Equal', category: 'Math', codepoint: 'U+2264' },
  { char: '≥', name: 'Greater-Equal', category: 'Math', codepoint: 'U+2265' },
  { char: '✓', name: 'Check Mark', category: 'Symbol', codepoint: 'U+2713' },
  { char: '✗', name: 'Ballot X', category: 'Symbol', codepoint: 'U+2717' },
  { char: '★', name: 'Black Star', category: 'Symbol', codepoint: 'U+2605' },
  { char: '☆', name: 'White Star', category: 'Symbol', codepoint: 'U+2606' },
  { char: '♥', name: 'Black Heart', category: 'Symbol', codepoint: 'U+2665' },
  { char: '♦', name: 'Black Diamond', category: 'Symbol', codepoint: 'U+2666' },
  { char: '♠', name: 'Black Spade', category: 'Symbol', codepoint: 'U+2660' },
  { char: '♣', name: 'Black Club', category: 'Symbol', codepoint: 'U+2663' },
  { char: 'α', name: 'Greek Alpha', category: 'Greek', codepoint: 'U+03B1' },
  { char: 'β', name: 'Greek Beta', category: 'Greek', codepoint: 'U+03B2' },
  { char: 'π', name: 'Greek Pi', category: 'Greek', codepoint: 'U+03C0' },
  { char: 'Σ', name: 'Greek Sigma', category: 'Greek', codepoint: 'U+03A3' },
  { char: 'Ω', name: 'Greek Omega', category: 'Greek', codepoint: 'U+03A9' },
  { char: 'µ', name: 'Micro Sign', category: 'Symbol', codepoint: 'U+00B5' },
  { char: '§', name: 'Section Sign', category: 'Symbol', codepoint: 'U+00A7' },
  { char: '¶', name: 'Pilcrow Sign', category: 'Symbol', codepoint: 'U+00B6' },
  { char: '†', name: 'Dagger', category: 'Symbol', codepoint: 'U+2020' },
  { char: '‡', name: 'Double Dagger', category: 'Symbol', codepoint: 'U+2021' },
];

/**
 * Analyze the first codepoint of `text` (surrogate-pair aware).
 * @param {string} text
 */
export function analyzeChar(text) {
  const chars = Array.from(String(text));
  if (chars.length === 0) return null;
  const char = chars[0];
  const code = /** @type {number} */ (char.codePointAt(0));
  const hexBody = code.toString(16).toUpperCase();
  return {
    char,
    name: getCharName(char),
    category: 'Character',
    codepoint: 'U+' + hexBody.padStart(4, '0'),
    decimal: code,
    hex: '0x' + hexBody,
    html: `&#${code};`,
    css: `\\${hexBody}`,
    js: code > 0xffff ? `\\u{${hexBody}}` : `\\u${hexBody.padStart(4, '0')}`,
  };
}

/** @param {string} char */
export function getCharName(char) {
  try {
    return char.toUpperCase() + ' Character';
  } catch {
    return 'Unknown Character';
  }
}

/**
 * Filter COMMON_CHARS by name or category substring (case-insensitive),
 * same as the web search box.
 * @param {string} query
 */
export function searchCommon(query) {
  const q = String(query).toLowerCase();
  if (!q) return [];
  return COMMON_CHARS.filter(
    (c) => c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
  );
}
