/**
 * UUID core — behavior ported from apps/web UuidTool.svelte + utils/crypto.js.
 */

export const MIN_COUNT = 1;
export const MAX_COUNT = 100;

/**
 * @param {string | number} value
 * @returns {number | false}
 */
export function validateCount(value) {
  if (value === '' || value === null || value === undefined) return false;
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(num)) return false;
  if (!Number.isInteger(num)) return false;
  return num;
}

/**
 * @param {string | number} value
 * @returns {number}
 */
export function sanitizeCount(value) {
  let num = validateCount(value);
  if (num === false) return MIN_COUNT;
  if (num < MIN_COUNT) return MIN_COUNT;
  if (num > MAX_COUNT) return MAX_COUNT;
  return num;
}

/**
 * @param {number} [count]
 * @returns {string[]}
 */
export function generate(count = 1) {
  return Array.from({ length: count }, () => crypto.randomUUID());
}
