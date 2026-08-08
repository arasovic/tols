import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const packageJson = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
);
const c8Config = JSON.parse(
  readFileSync(new URL('../.c8rc.json', import.meta.url), 'utf8'),
);

describe('CLI coverage configuration', () => {
  it('uses c8 only as a development collector', () => {
    expect(packageJson.scripts['test:coverage']).toBe('c8 vitest --run');
    expect(packageJson.devDependencies.c8).toBe('^12.0.0');
    expect(packageJson.dependencies?.c8).toBeUndefined();
  });

  it('includes every shipped CLI source in an isolated report', () => {
    expect(c8Config.all).toBe(true);
    expect(c8Config.include).toEqual(['bin/**/*.js', 'src/**/*.js']);
    expect(c8Config['reports-dir']).toBe('../../coverage/cli');
  });

  it('emits reusable reports and enforces global workspace floors', () => {
    expect(c8Config.reporter).toEqual(['text-summary', 'json-summary', 'lcov']);
    expect(c8Config['check-coverage']).toBe(true);
    expect(c8Config.statements).toBe(83);
    expect(c8Config.branches).toBe(79);
    expect(c8Config.functions).toBe(93);
    expect(c8Config.lines).toBe(83);
    expect(c8Config['per-file']).toBeUndefined();
  });
});
