import { describe, it, expect } from 'vitest';
import { emit, fail } from '../../src/output.js';

class Sink {
  constructor() { this.data = ''; }
  write(s) { this.data += s; }
}

describe('emit', () => {
  it('writes plain string result', () => {
    const out = new Sink();
    emit(out, 'hello', {});
    expect(out.data).toBe('hello\n');
  });

  it('uses text field for {text,json} values in plain mode', () => {
    const out = new Sink();
    emit(out, { text: 'plain', json: { a: 1 } }, {});
    expect(out.data).toBe('plain\n');
  });

  it('wraps result in JSON envelope', () => {
    const out = new Sink();
    emit(out, 'hello', { json: true });
    expect(JSON.parse(out.data)).toEqual({ ok: true, result: 'hello' });
  });

  it('uses json field for {text,json} values in JSON mode', () => {
    const out = new Sink();
    emit(out, { text: 'plain', json: { a: 1 } }, { json: true });
    expect(JSON.parse(out.data)).toEqual({ ok: true, result: { a: 1 } });
  });
});

describe('fail', () => {
  it('writes to stderr in plain mode and returns exit code', () => {
    const err = new Sink();
    const out = new Sink();
    const code = fail(err, out, 'boom', {}, 1);
    expect(code).toBe(1);
    expect(err.data).toBe('tols: boom\n');
    expect(out.data).toBe('');
  });

  it('writes JSON envelope to stdout in JSON mode', () => {
    const err = new Sink();
    const out = new Sink();
    fail(err, out, 'boom', { json: true }, 2);
    expect(JSON.parse(out.data)).toEqual({ ok: false, error: 'boom' });
    expect(err.data).toBe('');
  });
});
