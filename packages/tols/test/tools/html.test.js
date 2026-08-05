import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols html', () => {
  it('fmt via stdin', async () => {
    const r = await tols(['html', 'fmt'], { stdin: '<div><p>hi</p></div>\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('<div>\n  <p>\n    hi\n  </p>\n</div>\n');
  });

  it('defaults to fmt', async () => {
    const r = await tols(['html', '<b>x</b>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<b>\n  x\n</b>\n');
  });

  it('min with --remove-comments', async () => {
    const r = await tols(['html', 'min', '<p>a</p><!-- c -->', '--remove-comments']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<p>a</p>\n');
  });

  it('--json envelope', async () => {
    const r = await tols(['html', 'min', '<b> x </b>', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out).result).toBe('<b> x </b>');
  });
});
