/**
 * Color core — conversions ported from apps/web ColorTool.svelte.
 * Same parsing tolerance (hex strips non-hex chars, 3-digit expansion,
 * rgba/hsla alpha ignored, h=360 wraps to 0) and rounding as the web.
 */

/** @param {string} hexInput */
export function hexToRgb(hexInput) {
  let clean = String(hexInput).replace(/[^0-9A-Fa-f]/g, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return null;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null;
  return { r, g, b };
}

/**
 * @param {number} r @param {number} g @param {number} b
 * @returns {{ h: number, s: number, l: number }}
 */
export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/**
 * @param {number} h @param {number} s @param {number} l
 * @returns {{ r: number, g: number, b: number }}
 */
export function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(255 * f(0)), g: Math.round(255 * f(8)), b: Math.round(255 * f(4)) };
}

/** @param {string} value e.g. `rgb(255, 0, 0)` or `rgba(...,0.5)` */
export function parseRgbInput(value) {
  const m = String(value).match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/i);
  if (!m) return null;
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  if (r > 255 || g > 255 || b > 255) return null;
  return { r, g, b };
}

/** @param {string} value e.g. `hsl(120, 50%, 50%)` or `hsla(...,0.5)` */
export function parseHslInput(value) {
  const m = String(value).match(/^hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const s = parseInt(m[2], 10);
  const l = parseInt(m[3], 10);
  if (h === 360) h = 0;
  if (h < 0 || h >= 360 || s > 100 || l > 100) return null;
  return { h, s, l };
}

/** @param {{ r: number, g: number, b: number }} rgb */
export function rgbToHex(rgb) {
  return [rgb.r, rgb.g, rgb.b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/**
 * Parse any supported input (hex, rgb()/rgba(), hsl()/hsla()) into a
 * canonical result. Throws with web-parity messages on bad input.
 * @param {string} input
 */
export function parse(input) {
  const value = String(input).trim();
  if (/^rgba?\(/i.test(value)) {
    const rgb = parseRgbInput(value);
    if (!rgb) throw new Error('Invalid RGB format. Expected: rgb(255, 0, 0)');
    return fromRgb(rgb);
  }
  if (/^hsla?\(/i.test(value)) {
    const hsl = parseHslInput(value);
    if (!hsl) throw new Error('Invalid HSL format. Expected: hsl(120, 50%, 50%)');
    return fromRgb(hslToRgb(hsl.h, hsl.s, hsl.l));
  }
  const rgb = hexToRgb(value);
  if (!rgb) throw new Error('Invalid color format');
  return fromRgb(rgb);
}

function fromRgb(rgb) {
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  return {
    rgb,
    hsl,
    hex: rgbToHex(rgb),
    rgbString: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    hslString: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
  };
}
