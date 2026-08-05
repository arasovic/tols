import { readFile } from 'node:fs/promises';
import * as core from '../core/datauri.js';
import { UsageError, resolveInput } from '../io.js';

function readBinaryStdin(stdin) {
  return new Promise((resolve, reject) => {
    /** @type {Buffer[]} */
    const chunks = [];
    stdin.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    stdin.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))));
    stdin.on('error', reject);
  });
}

export default {
  name: 'datauri',
  aliases: ['duri'],
  defaultAction: 'enc',
  actions: {
    enc: {
      description: 'encode a file (path arg) or piped binary stdin into a data URI (--mime overrides inference)',
      rawArgs: true,
      run: async ({ args, stdin }, flags) => {
        let bytes;
        let mime;
        if (args.length > 0) {
          const path = args[0];
          try {
            bytes = new Uint8Array(await readFile(path));
          } catch {
            throw new UsageError(`cannot read file: ${path}`);
          }
          mime = flags.mime ? String(flags.mime) : core.inferMimeType(path);
        } else if (!stdin.isTTY) {
          bytes = await readBinaryStdin(stdin);
          mime = flags.mime ? String(flags.mime) : 'application/octet-stream';
        } else {
          throw new UsageError('no input: pass a file path or pipe binary stdin');
        }
        const uri = core.bytesToDataUri(bytes, mime);
        return {
          text: uri,
          json: { uri, mime, encoding: 'base64', bytes: bytes.byteLength },
        };
      },
    },
    dec: {
      description: 'decode a data URI to raw bytes on stdout',
      run: async (input, _flags, extra) => {
        const parsed = core.parseDataUri(input);
        return {
          binary: parsed.bytes,
          json: {
            mime: parsed.mime,
            encoding: parsed.encoding,
            bytes: parsed.bytes.byteLength,
            base64: Buffer.from(parsed.bytes).toString('base64'),
          },
        };
      },
    },
  },
};
