import * as core from '../core/hash.js';

export default {
  name: 'hash',
  aliases: ['hs'],
  defaultAction: 'sha256',
  actions: Object.fromEntries(
    core.ALGORITHMS.map((algo) => [
      algo,
      { description: `${algo.toUpperCase()} digest of input`, run: async (input) => core.hash(input, algo) },
    ])
  ),
};
