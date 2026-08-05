import * as core from '../core/placeholder.js';
import { UsageError } from '../io.js';

function parseColor(value, flagName) {
  if (value === undefined) return undefined;
  let v = String(value).trim();
  if (!v.startsWith('#')) v = '#' + v;
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) {
    throw new UsageError(`invalid ${flagName}: ${value} (expected #RRGGBB)`);
  }
  return v;
}

export default {
  name: 'placeholder',
  aliases: ['ph'],
  defaultAction: 'gen',
  actions: {
    gen: {
      description: 'generate a placeholder image as SVG (--width --height --bg --text-color --text)',
      needsInput: false,
      run: (_input, flags) => {
        const { svg, width, height, contrastRatio } = core.buildSvg({
          width: flags.width,
          height: flags.height,
          bg: parseColor(flags.bg, '--bg'),
          textColor: parseColor(flags['text-color'] ?? flags.textColor, '--text-color'),
          text: typeof flags.text === 'string' ? flags.text : undefined,
        });
        return {
          text: svg,
          json: { width, height, contrastRatio, svg },
        };
      },
    },
  },
};
