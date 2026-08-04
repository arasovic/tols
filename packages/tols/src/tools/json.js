import * as core from '../core/json.js';

export default {
  name: 'json',
  aliases: ['js'],
  defaultAction: 'fmt',
  actions: {
    fmt: {
      description: 'pretty-print JSON (--indent=N, default 2)',
      run: (input, flags) => core.format(input, flags.indent ? Number(flags.indent) : 2),
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
