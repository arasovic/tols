import * as core from '../core/diff.js';
import { expandArg, readStdin, UsageError } from '../io.js';

export default {
  name: 'diff',
  aliases: [],
  defaultAction: 'run',
  actions: {
    run: {
      description: 'line diff of two inputs: tols diff @a.txt @b.txt (- reads stdin)',
      rawArgs: true,
      run: async ({ args, stdin }, _flags) => {
        const sides = [];
        for (const a of args) {
          sides.push(a === '-' ? await readStdin(stdin) : await expandArg(a));
        }
        if (sides.length !== 2) {
          throw new UsageError('diff needs two inputs: tols diff @old.txt @new.txt (use - to read one side from stdin)');
        }
        const result = core.diffLines(sides[0], sides[1]);
        return { text: core.toPlainText(result), json: result };
      },
    },
  },
};
