import * as core from '../core/url.js';

function analyzeText(a) {
  const lines = [`url: ${a.href}`, `protocol: ${a.protocol}`, `host: ${a.host}`, `path: ${a.pathname}`];
  if (a.params.length) {
    lines.push('params:');
    for (const { key, value } of a.params) lines.push(`  ${key} = ${value}`);
  }
  if (a.hash) lines.push(`hash: ${a.hash}`);
  return lines.join('\n');
}

export default {
  name: 'url',
  aliases: [],
  defaultAction: 'enc',
  actions: {
    enc: { description: 'percent-encode text', run: (input) => core.encode(input) },
    dec: { description: 'decode percent-encoded text', run: (input) => core.decode(input) },
    analyze: {
      description: 'break a URL into protocol/host/path/params/hash',
      run: (input) => {
        const a = core.analyze(input);
        return { text: analyzeText(a), json: a };
      },
    },
  },
};
