import { describe, it, expect } from 'vitest';
import { tols } from '../helpers.js';

describe('tols html', () => {
  it('fmt via stdin', async () => {
    const r = await tols(['html', 'fmt'], { stdin: '<div><p>hi</p></div>\n' });
    expect(r.code).toBe(0);
    expect(r.out).toBe('<div>\n  <p>\n    hi\n  </p>\n</div>\n');
  });

  it('defaults to fmt', async () => {
    const r = await tols(['html', '<b>x</b>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<b>\n  x\n</b>\n');
  });

  it('fmt preserves quoted > in attributes', async () => {
    const r = await tols(['html', 'fmt', '<div data-expression="a > b"><span>x</span></div>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<div data-expression="a > b">\n  <span>\n    x\n  </span>\n</div>\n');
  });

  it('fmt keeps void elements', async () => {
    const r = await tols(['html', 'fmt', '<div><BR><IMG SRC="a.png"></div>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<div>\n  <BR>\n  <IMG SRC="a.png">\n</div>\n');
  });

  it('fmt preserves quoted > on void element', async () => {
    const r = await tols(['html', 'fmt', '<div><IMG data-expression="a > b"></div>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<div>\n  <IMG data-expression="a > b">\n</div>\n');
  });

  it('min preserves quoted whitespace and markup in attributes', async () => {
    const r = await tols(['html', 'min', '<div title="a  >  <  b">  x  </div>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<div title="a  >  <  b"> x </div>\n');
  });

  it('min with --remove-whitespace preserves quoted > < in attributes', async () => {
    const r = await tols(['html', 'min', '<div title="a  >  <  b">  x  </div>', '--remove-whitespace']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<div title="a  >  <  b"> x </div>\n');
  });

  it('min keeps doctype internal subset byte-exact', async () => {
    const r = await tols(['html', 'min', '<!DOCTYPE root [<!ENTITY x "a  >  <  b" >]><root/>']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<!DOCTYPE root [<!ENTITY x "a  >  <  b" >]><root/>\n');
  });

  it('min with --remove-whitespace keeps doctype internal subset byte-exact', async () => {
    const r = await tols(['html', 'min', '<!DOCTYPE root [<!ENTITY x "a  >  <  b" >]><root/>', '--remove-whitespace']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<!DOCTYPE root [<!ENTITY x "a  >  <  b" >]><root/>\n');
  });

  it('min with --remove-comments', async () => {
    const r = await tols(['html', 'min', '<p>a</p><!-- c -->', '--remove-comments']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('<p>a</p>\n');
  });

  it('min with --remove-comments and --remove-whitespace', async () => {
    const r = await tols(['html', 'min', 'a<!--x--><!---->b', '--remove-comments', '--remove-whitespace']);
    expect(r.code).toBe(0);
    expect(r.out).toBe('ab\n');
  });

  it('--json envelope', async () => {
    const r = await tols(['html', 'min', '<b> x </b>', '--json']);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.out).result).toBe('<b> x </b>');
  });
});
