import * as core from '../core/jwt.js';
import { UsageError } from '../io.js';

const DEFAULT_HEADER = { alg: 'HS256', typ: 'JWT' };

export default {
  name: 'jwt',
  aliases: [],
  defaultAction: 'dec',
  actions: {
    dec: {
      description: 'decode header/payload (no signature verification)',
      run: (input) => {
        const r = core.decode(input);
        const text = [`header:\n${JSON.stringify(r.header, null, 2)}`, `payload:\n${JSON.stringify(r.payload, null, 2)}`, `signature: ${r.signature}`].join('\n');
        return { text, json: r };
      },
    },
    enc: {
      description: 'sign an HS256 JWT: input = payload JSON, --secret=... required, --header=JSON optional',
      run: async (input, flags) => {
        if (!flags.secret || typeof flags.secret !== 'string') {
          throw new UsageError('enc requires --secret=<value>');
        }
        let header = DEFAULT_HEADER;
        if (flags.header) {
          try {
            header = JSON.parse(flags.header);
          } catch {
            throw new UsageError('--header must be valid JSON');
          }
        }
        try {
          JSON.parse(input);
        } catch {
          throw new Error('Invalid payload JSON');
        }
        return core.encode(header, input, flags.secret);
      },
    },
  },
};
