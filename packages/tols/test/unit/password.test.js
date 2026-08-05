import { describe, it, expect } from 'vitest';
import * as pw from '../../src/core/password.js';

describe('password core', () => {
  it('generates requested length from chosen charset', () => {
    const { password } = pw.generate(16, { lower: true });
    expect(password).toHaveLength(16);
    expect(password).toMatch(/^[a-z]+$/);
  });

  it('combines charsets in web order (lower, upper, numbers, symbols)', () => {
    expect(pw.buildCharset({ lower: true, upper: true, numbers: true, symbols: true })).toBe(
      pw.LOWERCASE + pw.UPPERCASE + pw.NUMBERS + pw.SYMBOLS
    );
  });

  it('throws when no charset selected (web message)', () => {
    expect(() => pw.generate(16, {})).toThrow('Please select at least one character type');
  });

  it('entropy matches log2(charset)*length', () => {
    const { entropy } = pw.generate(16, { lower: true, upper: true, numbers: true });
    expect(entropy).toBeCloseTo(Math.log2(62) * 16, 10);
  });

  it('entropy labels follow web thresholds', () => {
    expect(pw.entropyLabel(40)).toBe('Weak');
    expect(pw.entropyLabel(60)).toBe('Fair');
    expect(pw.entropyLabel(100)).toBe('Strong');
    expect(pw.entropyLabel(130)).toBe('Very Strong');
  });

  it('randomIndex stays in range', () => {
    for (let i = 0; i < 200; i++) {
      const n = pw.randomIndex(7);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(7);
    }
  });

  it('generates different passwords across calls', () => {
    const a = pw.generate(32, { lower: true, upper: true, numbers: true, symbols: true });
    const b = pw.generate(32, { lower: true, upper: true, numbers: true, symbols: true });
    expect(a.password).not.toBe(b.password);
  });
});
