import * as core from '../core/yaml.js';

export default {
  name: 'yaml',
  aliases: ['yml'],
  defaultAction: 'fmt',
  actions: {
    fmt: {
      description: 'normalize YAML (parse then re-serialize)',
      run: (input) => core.stringify(core.parse(input)).trim(),
    },
    json: {
      description: 'convert YAML to JSON',
      run: (input) => JSON.stringify(core.parse(input), null, 2),
    },
  },
};
