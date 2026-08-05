import { describe, it, expect } from 'vitest';
import * as color from '../../src/core/color.js';

describe('color core', () => {
  it('hex -> rgb/hsl', () => {
    const r = color.parse('#ff6b35');
    expect(r.rgb).toEqual({ r: 255, g: 107, b: 53 });
    expect(r.hsl).toEqual({ h: 16, s: 100, l: 60 });
  });

  it('3-digit hex expands', () => {
    expect(color.parse('#f00').rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('hex parsing strips stray chars (web parity)', () => {
    expect(color.parse('  FF 6B 35 ').hex).toBe('ff6b35');
  });

  it('rgb() input converts', () => {
    expect(color.parse('rgb(255, 107, 53)').hex).toBe('ff6b35');
  });

  it('rgba() alpha is ignored (web parity)', () => {
    expect(color.parse('rgba(10, 20, 30, 0.5)').rgb).toEqual({ r: 10, g: 20, b: 30 });
  });

  it('hsl() input converts (integer HSL is lossy, web parity)', () => {
    expect(color.parse('hsl(16, 100%, 60%)').hex).toBe('ff6933');
    expect(color.parse('hsl(120, 100%, 50%)').rgb).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('h=360 wraps to 0', () => {
    expect(color.parse('hsl(360, 100%, 50%)').rgb).toEqual({ r: 255, g: 0, b: 0 });
  });

  it('grayscale has zero saturation', () => {
    expect(color.parse('#808080').hsl).toEqual({ h: 0, s: 0, l: 50 });
  });

  it('rgb out of range rejected', () => {
    expect(() => color.parse('rgb(300, 0, 0)')).toThrow('Invalid RGB format');
  });

  it('bad hsl rejected', () => {
    expect(() => color.parse('hsl(400, 0%, 0%)')).toThrow('Invalid HSL format');
  });

  it('garbage rejected with web message', () => {
    expect(() => color.parse('zz')).toThrow('Invalid color format');
  });
});

describe('color deep-review fixes', () => {
  it('parses RGB()/HSL() case-insensitively', () => {
    expect(color.parse('RGB(255, 0, 0)').hex).toBe('ff0000');
    expect(color.parse('HSL(120, 50%, 50%)').rgb).toEqual({ r: 64, g: 191, b: 64 });
  });
});
