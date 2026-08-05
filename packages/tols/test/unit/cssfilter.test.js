import { describe, it, expect } from 'vitest';
import * as cf from '../../src/core/cssfilter.js';

describe('cssfilter core', () => {
  it('all defaults -> none', () => {
    expect(cf.buildFilter({})).toBe('none');
  });

  it('assembles in web order with correct units', () => {
    expect(cf.buildFilter({ blur: 2, brightness: 120, hueRotate: 90 })).toBe('blur(2px) brightness(120%) hue-rotate(90deg)');
  });

  it('clamps to limits', () => {
    expect(cf.buildFilter({ blur: 99 })).toBe('blur(20px)');
    expect(cf.buildFilter({ brightness: -5 })).toBe('brightness(0%)');
    expect(cf.buildFilter({ hueRotate: 400 })).toBe('hue-rotate(360deg)');
  });

  it('non-numeric becomes 0 (web parity)', () => {
    expect(cf.clampValue('blur', 'abc')).toBe(0);
  });

  it('full combination', () => {
    const all = { blur: 1, brightness: 110, contrast: 90, grayscale: 10, hueRotate: 45, invert: 20, saturate: 130, sepia: 30 };
    expect(cf.buildFilter(all)).toBe(
      'blur(1px) brightness(110%) contrast(90%) grayscale(10%) hue-rotate(45deg) invert(20%) saturate(130%) sepia(30%)'
    );
  });
});
