import { describe, expect, it } from 'vitest';
import { tols } from './helpers.js';

describe('CLI test helper', () => {
  it('settles when the child exits before consuming all stdin', async () => {
    const result = await tols(['--version'], {
      stdin: 'x'.repeat(16 * 1024 * 1024),
    });

    expect(result.code).toBe(0);
    expect(result.out.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    expect(result.err).toBe('');
  });
});
