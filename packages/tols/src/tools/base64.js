import * as core from '../core/base64.js';

export default {
  name: 'base64',
  aliases: ['b64'],
  defaultAction: 'enc',
  actions: {
    enc: { description: 'encode text to base64', run: (input) => core.encode(input) },
    dec: { description: 'decode base64 to text', run: (input) => core.decode(input) },
  },
};
