import { readFile } from 'node:fs/promises';

export class UsageError extends Error {}

/**
 * Expand a single input argument: `@<path>` reads a file (one trailing
 * newline stripped, same as piped stdin); anything else passes through.
 */
export async function expandArg(a) {
  if (!a.startsWith('@')) return a;
  let text;
  try {
    text = await readFile(a.slice(1), 'utf8');
  } catch {
    throw new UsageError(`cannot read file: ${a.slice(1)}`);
  }
  return text.replace(/\r?\n$/, '');
}

export async function readStdin(stdin) {
  const data = await readAll(stdin);
  return data.replace(/\r?\n$/, '');
}

/**
 * Resolve tool input: positional args joined by spaces, `@<path>` expands a
 * file, piped stdin is used when no args are given. Throws UsageError when
 * nothing is available.
 */
export async function resolveInput(args, { stdin, isTTY }) {
  const parts = [];
  for (const a of args) parts.push(await expandArg(a));
  if (parts.length > 0) return parts.join(' ');
  if (!isTTY) return readStdin(stdin);
  throw new UsageError('no input: pass an argument, pipe stdin, or use @<file>');
}

function readAll(stream) {
  return new Promise((resolve, reject) => {
    let data = '';
    stream.setEncoding('utf8');
    stream.on('data', (c) => (data += c));
    stream.on('end', () => resolve(data));
    stream.on('error', reject);
  });
}
