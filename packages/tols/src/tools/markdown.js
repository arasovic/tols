import * as core from '../core/markdown.js';

export default {
  name: 'markdown',
  aliases: ['md'],
  defaultAction: 'html',
  actions: {
    html: { description: 'render Markdown to HTML (hand-rolled, sanitizes URLs)', run: (input) => core.toHtml(input) },
  },
};
