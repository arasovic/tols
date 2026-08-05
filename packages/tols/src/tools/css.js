import * as core from '../core/css.js';

export default {
  name: 'css',
  defaultAction: 'fmt',
  actions: {
    fmt: { description: 'pretty-print CSS (2-space indent)', run: (input) => core.format(input) },
    min: { description: 'minify CSS (comments stripped)', run: (input) => core.minify(input) },
  },
};
