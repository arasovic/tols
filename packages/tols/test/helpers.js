import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const BIN = join(dirname(fileURLToPath(import.meta.url)), '..', 'bin', 'tols.js');

export function tols(args, { stdin = '' } = {}) {
  return new Promise((resolve) => {
    // TZ pinned so assertions about formatted dates are host-independent
    const p = spawn('node', [BIN, ...args], { env: { ...process.env, TZ: 'UTC' } });
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
