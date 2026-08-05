import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols sql', () => {
  it('fmt via stdin, keywords uppercased', async () => {
    const r = await tols(['sql', 'fmt'], { stdin: 'select a from t\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('SELECT a\nFROM t\n');
  });

  it('defaults to fmt', async () => {
    const r = await tols(['sql', 'select 1']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('SELECT 1\n');
  });

  it('--keyword-case=lower', async () => {
    const r = await tols(['sql', 'fmt', 'SELECT 1', '--keyword-case=lower']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('select 1\n');
  });

  it('bad --keyword-case -> exit 2', async () => {
    const r = await tols(['sql', 'fmt', 'SELECT 1', '--keyword-case=bogus']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('unknown --keyword-case');
  });

  it('min strips comments', async () => {
    const r = await tols(['sql', 'min', 'select 1 -- x']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('select 1\n');
  });

  it('--json envelope', async () => {
    const r = await tols(['sql', 'fmt', 'select 1', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out).result).toBe('SELECT 1');
  });
});
