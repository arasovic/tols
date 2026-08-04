import { readFile } from 'node:fs/promises';

export class UsageError extends Error {}

/**
 * Resolve tool input: positional args joined by spaces, `@<path>` expands a
 * file, piped stdin is used when no args are given. Throws UsageError when
 * nothing is available.
 */
export async function resolveInput(args, { stdin, isTTY }) {
  const parts = [];
  for (const a of args) {
    if (a.startsWith('@')) {
      try {
        parts.push(await readFile(a.slice(1), 'utf8'));
      } catch {
        throw new UsageError(`cannot read file: ${a.slice(1)}`);
      }
    } else {
      parts.push(a);
    }
  }
  if (parts.length > 0) return parts.join(' ');
  if (!isTTY) {
    // pipes conventionally end with a newline; strip one trailing \n (or \r\n)
    const data = await readAll(stdin);
    return data.replace(/\r?\n$/, '');
  }
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
