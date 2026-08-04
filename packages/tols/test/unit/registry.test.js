import { describe, it, expect, beforeEach } from 'vitest';
import { register, find, list, clear } from '../../src/registry.js';

const fake = (name, aliases = []) => ({ name, aliases, actions: {} });

describe('registry', () => {
  beforeEach(() => clear());

  it('finds tool by name and alias', () => {
    const t = fake('base64', ['b64']);
    register(t);
    expect(find('base64')).toBe(t);
    expect(find('b64')).toBe(t);
  });

  it('list returns each tool once despite aliases', () => {
    register(fake('base64', ['b64']));
    register(fake('json', ['js']));
    expect(list()).toHaveLength(2);
  });

  it('throws on duplicate name or alias', () => {
    register(fake('diff'));
    expect(() => register(fake('diff'))).toThrow(/duplicate tool name/);
    expect(() => register(fake('other', ['diff']))).toThrow(/duplicate tool alias/);
  });
});
