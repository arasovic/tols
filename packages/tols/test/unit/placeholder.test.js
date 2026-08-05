import { describe, it, expect } from 'vitest';
import * as ph from '../../src/core/placeholder.js';

describe('placeholder core', () => {
  it('defaults to 400x300 with web colors', () => {
    const { svg, width, height } = ph.buildSvg({});
    expect(width).toBe(400);
    expect(height).toBe(300);
    expect(svg).toContain('fill="#E5E7EB"');
    expect(svg).toContain('>400x300<');
    expect(svg).toContain('>Placeholder<');
  });

  it('clamps dimensions to 50..2000 (web parity)', () => {
    expect(ph.buildSvg({ width: 1, height: 99999 }).width).toBe(50);
    expect(ph.buildSvg({ width: 99999, height: 1 }).height).toBe(50);
    expect(ph.buildSvg({ width: 5000, height: 5000 }).width).toBe(2000);
  });

  it('uses custom text, truncated to 100 chars', () => {
    // wide canvas so the width-based truncation does not kick in
    const { svg } = ph.buildSvg({ width: 2000, height: 700, text: 'x'.repeat(150) });
    expect(svg).toContain('x'.repeat(100));
    expect(svg).not.toContain('x'.repeat(101));
  });

  it('font size follows web thresholds', () => {
    expect(ph.fontSizeFor(100, 80)).toBe(12);
    expect(ph.fontSizeFor(200, 120)).toBe(16);
    expect(ph.fontSizeFor(400, 300)).toBe(24);
    expect(ph.fontSizeFor(1000, 800)).toBe(32);
  });

  it('contrast math matches WCAG formula', () => {
    expect(ph.getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(ph.getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
  });

  it('warns on low contrast only when big enough', () => {
    const big = ph.buildSvg({ bg: '#777777', textColor: '#888888' });
    expect(big.svg).toContain('Low contrast');
    const small = ph.buildSvg({ width: 100, height: 60, bg: '#777777', textColor: '#888888' });
    expect(small.svg).not.toContain('Low contrast');
  });

  it('escapes text for XML', () => {
    const { svg } = ph.buildSvg({ text: '<b>"hi"&' });
    expect(svg).toContain('&lt;b&gt;&quot;hi&quot;&amp;');
  });

  it('border padding scales down on small canvases (web parity)', () => {
    const { svg } = ph.buildSvg({ width: 50, height: 50 });
    expect(svg).toContain('x="12" y="12"');
    expect(svg).toContain('stroke-width="2"');
  });
});
