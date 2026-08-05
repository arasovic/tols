/**
 * Placeholder image core — behavior ported from apps/web PlaceholderTool.svelte.
 * The web draws to a canvas and exports PNG; the CLI emits an SVG with the
 * same layout math (clamped dimensions, border padding, font scaling,
 * subtitle, WCAG contrast warning). Functional parity, different format.
 */

export const MIN_DIMENSION = 50;
export const MAX_DIMENSION = 2000;
export const MAX_TEXT_LENGTH = 100;
export const DEFAULTS = { width: 400, height: 300, bg: '#E5E7EB', textColor: '#374151' };

/** @param {number} value @param {number} min @param {number} max */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** @param {string} hexColor `#RRGGBB` */
export function getLuminance(hexColor) {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;
  const gammaCorrect = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * gammaCorrect(r) + 0.7152 * gammaCorrect(g) + 0.0722 * gammaCorrect(b);
}

/** @param {string} color1 @param {string} color2 */
export function getContrastRatio(color1, color2) {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/** Font size scaling, same thresholds as the web canvas renderer. */
export function fontSizeFor(width, height) {
  if (width < 150 || height < 100) return 12;
  if (width < 250 || height < 150) return 16;
  if (width > 800 || height > 600) return 32;
  return 24;
}

/** Approximate canvas measureText: average advance ~0.55em for sans-serif. */
export function estimateTextWidth(text, fontSize) {
  return text.length * fontSize * 0.55;
}

/** @param {string} s */
export function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * @param {{ width?: number, height?: number, bg?: string, textColor?: string, text?: string }} opts
 * @returns {{ svg: string, width: number, height: number, contrastRatio: number }}
 */
export function buildSvg(opts = {}) {
  const width = clamp(Math.round(Number(opts.width) || DEFAULTS.width), MIN_DIMENSION, MAX_DIMENSION);
  const height = clamp(Math.round(Number(opts.height) || DEFAULTS.height), MIN_DIMENSION, MAX_DIMENSION);
  const bg = opts.bg || DEFAULTS.bg;
  const textColor = opts.textColor || DEFAULTS.textColor;
  const displayText = (opts.text || `${width}x${height}`).slice(0, MAX_TEXT_LENGTH);

  const borderPadding = Math.min(20, Math.floor(width / 4), Math.floor(height / 4));
  const hasBorder = width > borderPadding * 2 && height > borderPadding * 2;
  const fontSize = fontSizeFor(width, height);
  const contrastRatio = getContrastRatio(bg, textColor);

  // Truncate to fit inside the border (same loop shape as the web).
  const maxTextWidth = width - borderPadding * 2 - 10;
  let truncatedText = displayText;
  while (truncatedText.length > 0 && estimateTextWidth(truncatedText, fontSize) > maxTextWidth) {
    truncatedText = truncatedText.slice(0, -1);
  }
  if (truncatedText !== displayText) truncatedText += '...';

  const subtitleFontSize = Math.max(10, Math.floor(fontSize * 0.6));
  const subtitleOffset = Math.max(20, Math.floor(fontSize * 0.8));
  const subtitleY = Math.min(height / 2 + subtitleOffset, height - borderPadding - 10);

  const parts = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  parts.push(`  <rect width="${width}" height="${height}" fill="${bg}"/>`);
  if (hasBorder) {
    parts.push(`  <rect x="${borderPadding}" y="${borderPadding}" width="${width - borderPadding * 2}" height="${height - borderPadding * 2}" fill="none" stroke="${textColor}" stroke-width="2"/>`);
  }
  parts.push(`  <text x="${width / 2}" y="${height / 2}" fill="${textColor}" font-family="sans-serif" font-weight="bold" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${escapeXml(truncatedText)}</text>`);
  parts.push(`  <text x="${width / 2}" y="${subtitleY}" fill="${textColor}" font-family="sans-serif" font-size="${subtitleFontSize}" text-anchor="middle" dominant-baseline="middle">Placeholder</text>`);
  if (contrastRatio < 4.5 && width > 200 && height > 100) {
    const warnColor = contrastRatio < 2 ? 'rgba(255,0,0,0.8)' : 'rgba(255,165,0,0.9)';
    parts.push(`  <text x="${width - 5}" y="5" fill="${warnColor}" font-family="sans-serif" font-size="10" text-anchor="end" dominant-baseline="hanging">Low contrast: ${contrastRatio.toFixed(1)}:1</text>`);
  }
  parts.push('</svg>');
  return { svg: parts.join('\n'), width, height, contrastRatio: Number(contrastRatio.toFixed(2)) };
}
