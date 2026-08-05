import * as core from '../core/html.js';

export default {
  name: 'html',
  defaultAction: 'fmt',
  actions: {
    fmt: { description: 'pretty-print HTML (2-space indent, void elements kept inline)', run: (input) => core.format(input) },
    min: {
      description: 'minify HTML (--remove-comments, --remove-whitespace)',
      run: (input, flags) =>
        core.minify(input, {
          removeComments: Boolean(flags['remove-comments'] ?? flags.removeComments),
          removeWhitespace: Boolean(flags['remove-whitespace'] ?? flags.removeWhitespace),
        }),
    },
  },
};
