import * as core from '../core/lorem.js';
import { UsageError } from '../io.js';

export default {
  name: 'lorem',
  defaultAction: 'gen',
  actions: {
    gen: {
      description: 'generate lorem ipsum (--paragraphs=1..50 --words=1..500 (0=random), --random-start to drop the classic opener)',
      needsInput: false,
      run: (_input, flags) => {
        const paragraphs = flags.paragraphs === undefined ? 3 : Number(flags.paragraphs);
        const words = flags.words === undefined ? 50 : Number(flags.words);
        if (!Number.isInteger(paragraphs) || paragraphs < 1) {
          throw new UsageError('--paragraphs must be an integer >= 1');
        }
        if (!Number.isInteger(words) || words < 0) {
          throw new UsageError('--words must be an integer >= 0 (0 = random per paragraph)');
        }
        const startWithLorem = !(flags['random-start'] || flags.randomStart);
        const text = core.generate({ paragraphs, words, startWithLorem });
        return { text, json: { text, paragraphs, words, startWithLorem } };
      },
    },
  },
};
