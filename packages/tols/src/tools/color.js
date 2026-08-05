import * as core from '../core/color.js';

export default {
  name: 'color',
  aliases: ['clr'],
  defaultAction: 'conv',
  actions: {
    conv: {
      description: 'convert a color between hex, rgb(), hsl() (accepts any of the three)',
      run: (input) => {
        const r = core.parse(input);
        return {
          text: `hex: #${r.hex}\nrgb: ${r.rgbString}\nhsl: ${r.hslString}`,
          json: r,
        };
      },
    },
  },
};
