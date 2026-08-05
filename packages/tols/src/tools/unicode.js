import * as core from '../core/unicode.js';
import { UsageError } from '../io.js';

function formatInfo(a) {
  return [
    `char:      ${a.char}`,
    `name:      ${a.name}`,
    `codepoint: ${a.codepoint}`,
    `decimal:   ${a.decimal}`,
    `hex:       ${a.hex}`,
    `html:      ${a.html}`,
    `css:       ${a.css}`,
    `js:        ${a.js}`,
  ].join('\n');
}

export default {
  name: 'unicode',
  aliases: ['uni'],
  defaultAction: 'info',
  actions: {
    info: {
      description: 'analyze the first codepoint of input (codepoint, decimal, hex, html/css/js escapes)',
      run: (input) => {
        const a = core.analyzeChar(input);
        if (!a) throw new UsageError('no input: pass a character, pipe stdin, or use @<file>');
        return { text: formatInfo(a), json: a };
      },
    },
    search: {
      description: 'search the common-char table by name or category',
      run: (input) => {
        const matches = core.searchCommon(input);
        const text = matches.map((c) => `${c.char} ${c.codepoint} ${c.name} (${c.category})`).join('\n');
        return { text, json: matches };
      },
    },
  },
};
