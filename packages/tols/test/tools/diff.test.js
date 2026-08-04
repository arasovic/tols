import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tols } from '../helpers.js';

function tmpFiles(a, b) {
  const dir = mkdtempSync(join(tmpdir(), 'tols-diff-'));
  const fa = join(dir, 'a.txt');
  const fb = join(dir, 'b.txt');
  writeFileSync(fa, a);
  writeFileSync(fb, b);
  return [fa, fb];
}

describe('tols diff', () => {
  it('diffs two @files', async () => {
    const [fa, fb] = tmpFiles('a\nb\nc', 'a\nx\nc');
    const r = await tols(['diff', `@${fa}`, `@${fb}`]);
    expect(r.code).toBe(0);
    expect(r.out).toContain('  a');
    expect(r.out).toContain('- b');
    expect(r.out).toContain('+ x');
  });

  it('reads one side from stdin via - marker', async () => {
    const [, fb] = tmpFiles('IGNORED', 'a\nx');
    const r = await tols(['diff', `@${fb}`, '-'], { stdin: 'a\nb\n' });
    expect(r.code).toBe(0);
    // file is side A, stdin side B
    expect(r.out).toContain('- x');
    expect(r.out).toContain('+ b');
  });

  it('identical files -> exit 0, no markers', async () => {
    const [fa, fb] = tmpFiles('same', 'same');
    const r = await tols(['diff', `@${fa}`, `@${fb}`]);
    expect(r.code).toBe(0);
    expect(r.out).not.toContain('- ');
    expect(r.out).not.toContain('+ ');
  });

  it('--json returns differ flag and items', async () => {
    const [fa, fb] = tmpFiles('a', 'b');
    const r = await tols(['diff', `@${fa}`, `@${fb}`, '--json']);
    expect(r.code).toBe(0);
    const j = JSON.parse(r.out);
    expect(j.result.differ).toBe(true);
    expect(Array.isArray(j.result.items)).toBe(true);
  });

  it('missing second input -> usage error exit 2', async () => {
    const [fa] = tmpFiles('a', 'b');
    const r = await tols(['diff', `@${fa}`]);
    expect(r.code).toBe(2);
    expect(r.err).toContain('diff needs two inputs');
  });
});
