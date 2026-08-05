import * as core from '../core/regex.js';
import { UsageError } from '../io.js';

function getPattern(flags) {
  const pattern = typeof flags.pattern === 'string' ? flags.pattern : '';
  if (!pattern) throw new UsageError('--pattern is required');
  return pattern;
}

export default {
  name: 'regex',
  aliases: ['re'],
  defaultAction: 'match',
  actions: {
    match: {
      description: 'find matches in input text (--pattern, --flags=gimsuy default g; one match per line, --json for groups/indexes)',
      run: (input, flags) => {
        const pattern = getPattern(flags);
        const flagString = typeof flags.flags === 'string' ? flags.flags : 'g';
        const matches = core.match(pattern, flagString, input);
        return {
          text: matches.map((m) => m.value).join('\n'),
          json: matches,
        };
      },
    },
    replace: {
      description: 'replace matches in input text (--pattern, --flags, --replacement, $1/$<name> backrefs)',
      run: (input, flags) => {
        const pattern = getPattern(flags);
        const flagString = typeof flags.flags === 'string' ? flags.flags : 'g';
        const replacement = typeof flags.replacement === 'string' ? flags.replacement : '';
        return core.replace(pattern, flagString, input, replacement);
      },
    },
  },
};
