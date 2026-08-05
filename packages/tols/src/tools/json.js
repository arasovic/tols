import * as core from '../core/json.js';
import { UsageError } from '../io.js';

export default {
  name: 'json',
  aliases: ['js'],
  defaultAction: 'fmt',
  actions: {
    fmt: {
      description: 'pretty-print JSON (--indent=N, 0-10, default 2)',
      run: (input, flags) => {
        const indent = flags.indent === undefined ? 2 : Number(flags.indent);
        if (!Number.isInteger(indent) || indent < 0 || indent > 10) {
          throw new UsageError('--indent must be an integer between 0 and 10');
        }
        return core.format(input, indent);
      },
    },
    min: { description: 'minify JSON', run: (input) => core.minify(input) },
    val: {
      description: 'validate JSON (exit 1 when invalid)',
      run: (input) => {
        const r = core.validate(input);
        if (!r.valid) throw new Error(r.error);
        return { text: 'valid', json: true };
      },
    },
  },
};
