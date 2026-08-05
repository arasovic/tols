import * as core from '../core/sql.js';
import { UsageError } from '../io.js';

const CASES = { upper: 'uppercase', lower: 'lowercase', uppercase: 'uppercase', lowercase: 'lowercase', preserve: 'preserve' };

export default {
  name: 'sql',
  defaultAction: 'fmt',
  actions: {
    fmt: {
      description: 'pretty-print SQL (--keyword-case=upper|lower|preserve)',
      run: (input, flags) => {
        const raw = flags['keyword-case'] ?? flags.keywordCase ?? 'upper';
        const keywordCase = CASES[String(raw)];
        if (!keywordCase) throw new UsageError(`unknown --keyword-case: ${raw} (valid: upper, lower, preserve)`);
        return core.format(input, { keywordCase });
      },
    },
    min: { description: 'minify SQL (comments stripped)', run: (input) => core.minify(input) },
  },
};
