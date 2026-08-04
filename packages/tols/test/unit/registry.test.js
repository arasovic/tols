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

  it('does not overwrite existing tool name with an alias', () => {
    const a = fake('diff');
    const b = fake('other', ['diff']);
    register(a);
    register(b);
    expect(find('diff')).toBe(a);
  });
});
