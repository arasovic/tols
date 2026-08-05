import { describe, it, expect } from 'vitest';
import * as base from '../../src/core/base.js';

describe('base core', () => {
  it('converts decimal to all bases', () => {
    expect(base.convert('255')).toMatchObject({ dec: '255', bin: '11111111', hex: 'FF', oct: '377' });
  });

  it('auto-detects prefixes', () => {
    expect(base.convert('0xff').from).toBe('hex');
    expect(base.convert('0B101').from).toBe('bin');
    expect(base.convert('0o17').from).toBe('oct');
    expect(base.convert('-0x10').value).toBe(-16);
  });

  it('explicit from overrides detection', () => {
    expect(base.convert('ff', { from: 'hex' }).value).toBe(255);
    expect(base.convert('10', { from: 'bin' }).value).toBe(2);
  });

  it('uppercases hex output (web parity)', () => {
    expect(base.convert('255').hex).toBe('FF');
  });

  it('handles negatives', () => {
    expect(base.convert('-255')).toMatchObject({ bin: '-11111111', hex: '-FF' });
  });

  it('accepts leading zeros', () => {
    expect(base.convert('007').value).toBe(7);
  });

  it('rejects trailing garbage', () => {
    expect(() => base.convert('12abc')).toThrow('Invalid decimal number');
    expect(() => base.convert('0xGG')).toThrow('Invalid hexadecimal number');
  });

  it('rejects beyond MAX_SAFE_INTEGER with web message', () => {
    expect(() => base.convert('9999999999999999999999')).toThrow('Number exceeds maximum safe integer');
  });

  it('rejects unknown base', () => {
    expect(() => base.convert('1', { from: 'tri' })).toThrow('unknown base');
  });

  it('rejects empty input', () => {
    expect(() => base.convert('')).toThrow('Invalid decimal number');
  });
});

describe('base review fixes', () => {
  it('explicit --from tolerates prefixes', () => {
    expect(base.convert('0xff', { from: 'hex' }).value).toBe(255);
    expect(base.convert('-0b101', { from: 'bin' }).value).toBe(-5);
  });

  it('explicit --from with mismatched prefix digits still rejects', () => {
    expect(() => base.convert('0xff', { from: 'bin' })).toThrow(/Invalid binary/);
  });
});
