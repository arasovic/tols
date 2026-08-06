import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

/**
 * The `exports` map is the only part of this package that no other test can
 * reach: every test in test/unit imports core modules by relative path, so the
 * map could be broken for months without turning a suite red. It is also the
 * part consumers hit first.
 *
 * These tests import by *package name*. Node resolves that through `exports`
 * via self-reference (the package's own name is resolvable inside it), so what
 * runs here is the same resolution an installed consumer gets.
 */

const PKG_ROOT = fileURLToPath(new URL('..', import.meta.url));
const CORE_DIR = join(PKG_ROOT, 'src', 'core');
const README = readFileSync(join(PKG_ROOT, 'README.md'), 'utf8');

/** Every core module ships, so every one of them must be reachable. */
function coreModuleNames() {
  return readdirSync(CORE_DIR)
    .filter((f) => f.endsWith('.js'))
    .map((f) => f.slice(0, -3))
    .sort();
}

/** Import specifiers the README tells people to write, in prose and in code. */
function documentedSpecifiers() {
  const found = new Set();
  for (const [, spec] of README.matchAll(/from '(tols(?:\/[^']+)?)'/g)) {
    found.add(spec);
  }
  return [...found].sort();
}

describe('package exports', () => {
  it('documents at least the root and one deep import', () => {
    // Guards the two regexes above: if the README is reworded so that no
    // specifier matches, the "every documented specifier" test would pass
    // vacuously over an empty list.
    const specs = documentedSpecifiers();
    expect(specs).toContain('tols');
    expect(specs.some((s) => s.startsWith('tols/core/'))).toBe(true);
  });

  it('resolves every specifier the README documents', async () => {
    for (const spec of documentedSpecifiers()) {
      await expect(import(spec), `README documents ${spec}`).resolves.toBeDefined();
    }
  });

  it('exposes every core module under tols/core/', async () => {
    for (const name of coreModuleNames()) {
      const mod = await import(`tols/core/${name}`);
      expect(Object.keys(mod).length, `tols/core/${name} exports nothing`).toBeGreaterThan(0);
    }
  });

  it('accepts a deep import written with or without the .js extension', async () => {
    // A single "./core/*" pattern maps 'tols/core/gzip.js' onto
    // src/core/gzip.js.js, which is what the README asked people to write.
    const withExt = await import('tols/core/gzip.js');
    const withoutExt = await import('tols/core/gzip');
    expect(Object.keys(withExt).sort()).toEqual(Object.keys(withoutExt).sort());
  });

  it('fails on a subpath that does not exist', async () => {
    // Node resolves a pattern subpath without checking the target exists, so a
    // test built on import.meta.resolve alone would pass against the bug above.
    // Importing is what proves the file is there.
    await expect(import('tols/core/not-a-real-module')).rejects.toThrow();
  });

  it('ships every file the exports map points at', () => {
    const pkg = JSON.parse(readFileSync(join(PKG_ROOT, 'package.json'), 'utf8'));
    const shipped = pkg.files;
    for (const target of Object.values(pkg.exports)) {
      const top = target.replace(/^\.\//, '').split('/')[0];
      expect(shipped, `${target} is outside "files"`).toContain(top);
      if (!target.includes('*')) {
        expect(existsSync(join(PKG_ROOT, target)), `${target} is missing`).toBe(true);
      }
    }
  });
});
