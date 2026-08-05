import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { tols, BIN } from '../helpers.js';

const dir = mkdtempSync(join(tmpdir(), 'tols-duri-'));
const pngPath = join(dir, 'tiny.png');
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0xff, 0x00]);

describe('tols datauri', () => {
  it('enc from file path with inferred mime', async () => {
    writeFileSync(pngPath, PNG_BYTES);
    const r = await tols(['duri', 'enc', pngPath]);
    expect(r.code).toBe(0);
    expect(r.out.startsWith('data:image/png;base64,')).toBe(true);
  });

  it('enc --mime overrides inference', async () => {
    writeFileSync(pngPath, PNG_BYTES);
    const r = await tols(['duri', 'enc', pngPath, '--mime=application/custom']);
    expect(r.code).toBe(0);
    expect(r.out.startsWith('data:application/custom;base64,')).toBe(true);
  });

  it('enc missing file -> exit 2', async () => {
    const r = await tols(['duri', 'enc', '/nonexistent/nope.png']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('cannot read file');
  });

  it('enc -> dec round-trips raw bytes', async () => {
    writeFileSync(pngPath, PNG_BYTES);
    const enc = await tols(['duri', 'enc', pngPath]);
    expect(enc.code).toBe(0);
    // raw binary stdout must be read as bytes, not utf8 text
    const dec = spawnSync('node', [BIN, 'duri', 'dec', enc.out.trim()]);
    expect(dec.status).toBe(0);
    expect(dec.stdout.equals(PNG_BYTES)).toBe(true);
  });

  it('dec invalid data URI -> exit 1', async () => {
    const r = await tols(['duri', 'dec', 'not-a-data-uri']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid data URI');
  });

  it('dec --json reports metadata', async () => {
    writeFileSync(pngPath, PNG_BYTES);
    const enc = await tols(['duri', 'enc', pngPath]);
    const r = await tols(['duri', 'dec', enc.out.trim(), '--json']);
    expect(r.code).toBe(0);
    const p = JSON.parse(r.out);
    expect(p.result.mime).toBe('image/png');
    expect(p.result.bytes).toBe(PNG_BYTES.length);
  });

  it('enc from binary stdin', async () => {
    const r = await tols(['duri', 'enc', '--mime=image/png'], { stdin: PNG_BYTES.toString('latin1') });
    expect(r.code).toBe(0);
    expect(r.out.startsWith('data:image/png;base64,')).toBe(true);
  });
});
