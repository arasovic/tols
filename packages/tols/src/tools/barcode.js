import * as core from '../core/barcode.js';

export default {
  name: 'barcode',
  aliases: ['bc'],
  defaultAction: 'gen',
  actions: {
    gen: {
      description: 'encode printable ASCII as Code128, output SVG (printable ASCII 32-127, max 100 chars)',
      run: (input) => {
        const r = core.generate(input);
        return {
          text: r.svg,
          json: { set: r.set, values: r.values, width: r.width, svg: r.svg },
        };
      },
    },
  },
};
