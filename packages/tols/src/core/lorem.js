/**
 * Lorem ipsum core — behavior ported from apps/web LoremTool.svelte.
 * Same word list, clamps (paragraphs 0..50, words 0..500), crypto-random
 * word picks, capitalize-first + trailing period per paragraph.
 * One deliberate fix: the web's startWithLorem toggle is wired to the UI
 * badge but never applied in generate(); here it genuinely prefixes the
 * classic opener on the first paragraph.
 */

export const WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
  'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
  'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat',
  'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non',
  'proident', 'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit',
  'anim', 'id', 'est', 'laborum',
];

export const CLASSIC_OPENER = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
export const MAX_PARAGRAPHS = 50;
export const MAX_WORDS = 500;

/** @param {number} max */
export function randomIndex(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

/**
 * @param {{ paragraphs?: number, words?: number, startWithLorem?: boolean }} opts
 * @returns {string}
 */
export function generate(opts = {}) {
  const paragraphs = Math.min(Math.max(Math.trunc(Number(opts.paragraphs ?? 3)), 0), MAX_PARAGRAPHS);
  const words = Math.min(Math.max(Math.trunc(Number(opts.words ?? 50)), 0), MAX_WORDS);
  const startWithLorem = opts.startWithLorem ?? true;
  if (paragraphs < 1) return '';

  const paragraphTexts = [];
  for (let p = 0; p < paragraphs; p++) {
    // web parity: words=0 means a random 10..29 words per paragraph
    const wordCount = words === 0 ? Math.floor(Math.random() * 20) + 10 : words;
    const paragraphWords = [];
    for (let i = 0; i < wordCount; i++) {
      paragraphWords.push(WORDS[randomIndex(WORDS.length)]);
    }
    let text = paragraphWords.join(' ');
    text = text.charAt(0).toUpperCase() + text.slice(1) + '.';
    if (p === 0 && startWithLorem) text = `${CLASSIC_OPENER} ${text}`;
    paragraphTexts.push(text);
  }
  return paragraphTexts.join('\n\n');
}
