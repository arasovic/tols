// Fixture: standalone CLI with one fake tool, for spawn-testing cli.js.
import { register } from '../../src/registry.js';
import { run } from '../../src/cli.js';

register({
  name: 'echo',
  aliases: ['e'],
  defaultAction: 'run',
  actions: {
    run: { description: 'echo the input', run: (input) => input },
  },
});
register({
  name: 'strict',
  aliases: [],
  actions: {
    only: { description: 'has no default action', run: (input) => input },
  },
});

process.exitCode = await run(process.argv.slice(2));
