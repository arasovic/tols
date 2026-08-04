import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const FIXTURE = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'fake-cli.js');

function tols(args, { stdin = '' } = {}) {
  return new Promise((resolve) => {
    const p = spawn('node', [FIXTURE, ...args]);
    let out = '';
    let err = '';
    p.stdout.setEncoding('utf8');
    p.stderr.setEncoding('utf8');
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, out, err }));
    p.stdin.write(stdin);
    p.stdin.end();
  });
}

describe('cli contract', () => {
  it('runs a tool with positional input', async () => {
    const r = await tols(['echo', 'hello', 'world']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('hello world\n');
  });

  it('resolves aliases', async () => {
    const r = await tols(['e', 'hi']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('hi\n');
  });

  it('reads piped stdin when no positional input', async () => {
    const r = await tols(['echo'], { stdin: 'piped\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('piped\n');
  });

  it('--json wraps result in envelope', async () => {
    const r = await tols(['echo', 'hi', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out)).toEqual({ ok: true, result: 'hi' });
  });

  it('unknown tool -> exit 2 + stderr message', async () => {
    const r = await tols(['nope']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('unknown tool: nope');
  });

  it('unknown tool with --json -> JSON error envelope on stdout', async () => {
    const r = await tols(['nope', '--json']);
    expect(r.code).toBe(2);
    expect(JSON.parse(r.out)).toMatchObject({ ok: false, error: expect.stringContaining('unknown tool') });
  });

  it('tool without default action and no action given -> exit 2', async () => {
    const r = await tols(['strict', 'input']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('unknown action');
  });

  it('explicit action on tool without default works', async () => {
    const r = await tols(['strict', 'only', 'x']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('x\n');
  });

  it('no args -> usage on stderr, exit 2', async () => {
    const r = await tols([]);
    expect(r.code).toBe(2);
    expect(r.err).toContain('usage: tols');
  });

  it('help -> usage on stdout, exit 0', async () => {
    const r = await tols(['help']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('echo');
  });

  it('<tool> help lists actions', async () => {
    const r = await tols(['echo', 'help']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('run');
  });

  it('--version prints package version', async () => {
    const r = await tols(['--version']);
    expect(r.code).toBe(0);
    expect(r.out.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
