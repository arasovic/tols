import { describe, it, expect } from 'vitest';
import { generate, validateCount, sanitizeCount } from '../../src/core/uuid.js';

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuid core', () => {
  it('generates v4 format', () => {
    for (const id of generate(5)) expect(id).toMatch(V4);
  });

  it('generates unique ids', () => {
    const ids = generate(50);
    expect(new Set(ids).size).toBe(50);
  });

  it('validateCount rules', () => {
    expect(validateCount('10')).toBe(10);
    expect(validateCount('')).toBe(false);
    expect(validateCount('abc')).toBe(false);
    expect(validateCount(2.5)).toBe(false);
    expect(validateCount(NaN)).toBe(false);
  });

  it('sanitizeCount clamps', () => {
    expect(sanitizeCount(0)).toBe(1);
    expect(sanitizeCount(150)).toBe(100);
    expect(sanitizeCount('bad')).toBe(1);
    expect(sanitizeCount(7)).toBe(7);
  });
});
