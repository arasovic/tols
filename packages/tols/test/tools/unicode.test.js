import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols unicode', () => {
  it('info prints all fields', async () => {
    const r = await tols(['uni', 'info', 'é']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('codepoint: U+00E9');
    expect(r.out).toContain('decimal:   233');
    expect(r.out).toContain('html:      &#233;');
  });

  it('defaults to info via stdin', async () => {
    const r = await tols(['unicode'], { stdin: '€\n' });
    expect(r.code).toBe(0);
    expect(r.out).toContain('codepoint: U+20AC');
  });

  it('search finds arrows', async () => {
    const r = await tols(['uni', 'search', 'arrow']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('U+2192');
    expect(r.out.split('\n').filter(Boolean)).toHaveLength(4);
  });

  it('--json returns structured analysis', async () => {
    const r = await tols(['uni', 'info', 'π', '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.ok).toBe(true);
    expect(p.result.decimal).toBe(960);
  });

  it('no input -> exit 2 usage error', async () => {
    const r = await tols(['uni', 'info']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('no input');
  });
});
