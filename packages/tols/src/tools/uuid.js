import * as uuid from '../core/uuid.js';
import { UsageError } from '../io.js';

export default {
  name: 'uuid',
  aliases: ['id'],
  defaultAction: 'gen',
  actions: {
    gen: {
      description: 'generate UUIDv4 (--count=N, 1..100)',
      needsInput: false,
      run: (_input, flags) => {
        const count = flags.count === undefined ? 1 : uuid.validateCount(flags.count);
        if (count === false || count < uuid.MIN_COUNT || count > uuid.MAX_COUNT) {
          throw new UsageError(`count must be an integer between ${uuid.MIN_COUNT} and ${uuid.MAX_COUNT}`);
        }
        const ids = uuid.generate(count);
        return { text: ids.join('\n'), json: ids };
      },
    },
  },
};
