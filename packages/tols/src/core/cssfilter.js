/**
 * CSS filter core — behavior ported from apps/web CssFilterTool.svelte.
 * Same defaults, limits, clamping, and filter-string assembly.
 */

export const DEFAULTS = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  hueRotate: 0,
  invert: 0,
  saturate: 100,
  sepia: 0,
};

export const FILTER_LIMITS = {
  blur: { min: 0, max: 20 },
  brightness: { min: 0, max: 200 },
  contrast: { min: 0, max: 200 },
  grayscale: { min: 0, max: 100 },
  hueRotate: { min: 0, max: 360 },
  invert: { min: 0, max: 100 },
  saturate: { min: 0, max: 200 },
  sepia: { min: 0, max: 100 },
};

/** Clamp to the filter's limits; non-numbers become 0 (web parity). */
export function clampValue(name, value) {
  const limits = FILTER_LIMITS[name];
  const num = Number(value) || 0;
  if (!limits) return num;
  return Math.max(limits.min, Math.min(limits.max, num));
}

/**
 * Assemble the CSS filter value. Only non-default functions are emitted,
 * in web order; all defaults -> 'none'.
 * @param {Partial<typeof DEFAULTS>} values
 */
export function buildFilter(values = {}) {
  const v = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    if (values[key] !== undefined) v[key] = clampValue(key, values[key]);
  }
  const filters = [];
  if (v.blur > 0) filters.push(`blur(${v.blur}px)`);
  if (v.brightness !== 100) filters.push(`brightness(${v.brightness}%)`);
  if (v.contrast !== 100) filters.push(`contrast(${v.contrast}%)`);
  if (v.grayscale > 0) filters.push(`grayscale(${v.grayscale}%)`);
  if (v.hueRotate !== 0) filters.push(`hue-rotate(${v.hueRotate}deg)`);
  if (v.invert > 0) filters.push(`invert(${v.invert}%)`);
  if (v.saturate !== 100) filters.push(`saturate(${v.saturate}%)`);
  if (v.sepia > 0) filters.push(`sepia(${v.sepia}%)`);
  return filters.join(' ') || 'none';
}
