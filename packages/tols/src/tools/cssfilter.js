import * as core from '../core/cssfilter.js';

export default {
  name: 'cssfilter',
  defaultAction: 'gen',
  actions: {
    gen: {
      description: 'build a CSS filter value (--blur=px --brightness=% --contrast=% --grayscale=% --hue-rotate=deg --invert=% --saturate=% --sepia=%)',
      needsInput: false,
      run: (_input, flags) => {
        const values = {
          blur: flags.blur,
          brightness: flags.brightness,
          contrast: flags.contrast,
          grayscale: flags.grayscale,
          hueRotate: flags['hue-rotate'] ?? flags.hueRotate,
          invert: flags.invert,
          saturate: flags.saturate,
          sepia: flags.sepia,
        };
        for (const [k, v] of Object.entries(values)) {
          if (v !== undefined && Number.isNaN(Number(v))) {
            // web clamps garbage to 0; CLI reports it instead
            throw new Error(`invalid value for --${k === 'hueRotate' ? 'hue-rotate' : k}: ${v}`);
          }
        }
        const filter = core.buildFilter(values);
        return { text: filter, json: { filter, values: { ...core.DEFAULTS, ...pickDefined(values) } } };
      },
    },
  },
};

function pickDefined(values) {
  const out = {};
  for (const [k, v] of Object.entries(values)) {
    if (v !== undefined) out[k] = core.clampValue(k, v);
  }
  return out;
}
