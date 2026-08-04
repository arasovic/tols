import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveInput, UsageError } from '../../src/io.js';

const stdinOf = (s) => Readable.from([s]);

describe('resolveInput', () => {
  it('joins positional args with single space', async () => {
    expect(await resolveInput(['a', 'b'], { stdin: stdinOf(''), isTTY: true })).toBe('a b');
  });

  it('reads stdin when no args and piped', async () => {
    expect(await resolveInput([], { stdin: stdinOf('hi'), isTTY: false })).toBe('hi');
  });

  it('strips one trailing newline from piped stdin', async () => {
    expect(await resolveInput([], { stdin: stdinOf('hi\n'), isTTY: false })).toBe('hi');
    expect(await resolveInput([], { stdin: stdinOf('hi\n\n'), isTTY: false })).toBe('hi\n');
  });

  it('expands @file anywhere', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tols-'));
    const p = join(dir, 'in.txt');
    writeFileSync(p, 'from file');
    expect(await resolveInput([`@${p}`], { stdin: stdinOf(''), isTTY: true })).toBe('from file');
  });

  it('strips one trailing newline from @file content (same as stdin)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tols-'));
    const p = join(dir, 'in.txt');
    writeFileSync(p, 'line\n');
    expect(await resolveInput([`@${p}`], { stdin: stdinOf(''), isTTY: true })).toBe('line');
  });

  it('missing @file -> UsageError', async () => {
    await expect(resolveInput(['@/nope/missing.txt'], { stdin: stdinOf(''), isTTY: true })).rejects.toThrow(UsageError);
  });

  it('throws UsageError when no input at all', async () => {
    await expect(resolveInput([], { stdin: stdinOf(''), isTTY: true })).rejects.toThrow(UsageError);
  });
});
