import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols json', () => {
  it('formats piped JSON', async () => {
    const r = await tols(['js', 'fmt'], { stdin: '{"a":1}\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('{\n  "a": 1\n}\n');
  });

  it('respects --indent', async () => {
    const r = await tols(['js', 'fmt', '--indent=4'], { stdin: '{"a":1}\n' });
    expect(r.out).toBe('{\n    "a": 1\n}\n');
  });

  it('minifies', async () => {
    const r = await tols(['json', 'min', '{ "a" : 1 }']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('{"a":1}\n');
  });

  it('val passes with exit 0', async () => {
    const r = await tols(['js', 'val', '{"a":1}']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('valid\n');
  });

  it('val fails with exit 1 and line/column message', async () => {
    const r = await tols(['js', 'val'], { stdin: '{\n  "name": "test",\n  "value": 123\n  "broken": "string"\n}\n' });
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid JSON at line 4, column 3');
  });
});
