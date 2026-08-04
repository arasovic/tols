import * as core from '../core/cron.js';

function assertValid(input) {
  const err = core.validateCron(input.trim());
  if (err) throw new Error(err);
}

export default {
  name: 'cron',
  aliases: ['cr'],
  defaultAction: 'parse',
  actions: {
    parse: {
      description: 'describe a cron expression (validates first)',
      run: (input) => {
        assertValid(input);
        const description = core.getDescription(input.trim());
        return { text: description, json: { valid: true, description } };
      },
    },
    next: {
      description: 'next run times in ISO (--count=N, default 5)',
      run: (input, flags) => {
        assertValid(input);
        const count = flags.count ? Number(flags.count) : 5;
        const runs = core.getNextRuns(input.trim(), count).map((d) => d.toISOString());
        return { text: runs.join('\n'), json: runs };
      },
    },
    val: {
      description: 'validate only (exit 1 when invalid)',
      run: (input) => {
        assertValid(input);
        return { text: 'valid', json: true };
      },
    },
  },
};
