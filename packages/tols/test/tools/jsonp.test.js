import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols jsonp', () => {
  it('wrap positional JSON with default callback', async () => {
    const r = await tols(['jsonp', 'wrap', '{"a":1}']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('callback({"a":1})\n');
  });

  it('wrap with --callback via stdin', async () => {
    const r = await tols(['jsonp', 'wrap', '--callback=handleData'], { stdin: '[1,2,3]\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('handleData([1,2,3])\n');
  });

  it('wrap invalid JSON -> exit 1', async () => {
    const r = await tols(['jsonp', 'wrap', '{bad']);
    expect(r.code).toBe(1);
    expect(r.err).toContain('Invalid JSON response');
  });

  it('script requires --url', async () => {
    const r = await tols(['jsonp', 'script']);
    expect(r.code).toBe(2);
    expect(r.err).toContain('--url is required');
  });

  it('script builds tag', async () => {
    const r = await tols(['jsonp', 'script', '--url=https://api.test/x', '--callback=cb']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<script src="https://api.test/x?callback=cb"></script>\n');
  });

  it('script rejects invalid url/callback', async () => {
    const badUrl = await tols(['jsonp', 'script', '--url=nope']);
    expect(badUrl.code).toBe(2);
    expect(badUrl.err).toContain('invalid URL');
    const badCb = await tols(['jsonp', 'script', '--url=https://a.b', '--callback=1x']);
    expect(badCb.code).toBe(2);
    expect(badCb.err).toContain('invalid callback name');
  });

  it('--json envelope on wrap', async () => {
    const r = await tols(['jsonp', 'wrap', '{"a":1}', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out).result).toBe('callback({"a":1})');
  });
});
