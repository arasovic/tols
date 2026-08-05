import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols markdown', () => {
  it('html via stdin', async () => {
    const r = await tols(['md', 'html'], { stdin: '# Hi\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('<h1>Hi</h1>\n');
  });

  it('defaults to html', async () => {
    const r = await tols(['markdown', '**bold**']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<p><strong>bold</strong></p>\n');
  });

  it('complex document round-trip', async () => {
    const input = '# T\n\n- a\n- b\n\n```js\nx < y\n```\n';
    const r = await tols(['md', 'html'], { stdin: input });
    expect(r.code).toBe(0);
    expect(r.out).toContain('<h1>T</h1>');
    expect(r.out).toContain('<ul><li>a</li><li>b</li></ul>');
    expect(r.out).toContain('x &lt; y');
  });

  it('--json envelope', async () => {
    const r = await tols(['md', 'html', '*em*', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out).result).toBe('<p><em>em</em></p>');
  });
});
