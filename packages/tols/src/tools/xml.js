import * as core from '../core/xml.js';

export default {
  name: 'xml',
  defaultAction: 'fmt',
  actions: {
    fmt: { description: 'pretty-print XML (2-space indent)', run: (input) => core.format(input) },
    min: { description: 'minify XML (collapse inter-tag whitespace)', run: (input) => core.minify(input) },
    val: {
      description: 'validate XML structure (exit 1 when invalid)',
      run: (input) => {
        const err = core.validate(input);
        if (err) throw new Error(err);
        return { text: 'valid', json: true };
      },
    },
  },
};
