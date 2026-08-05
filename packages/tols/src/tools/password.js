import * as core from '../core/password.js';
import { UsageError } from '../io.js';

function boolFlag(flags, name, fallback) {
  const v = flags[name];
  if (v === undefined) return fallback;
  if (v === true) return true;
  if (v === 'false' || v === '0') return false;
  return true;
}

export default {
  name: 'password',
  aliases: ['pw'],
  defaultAction: 'gen',
  actions: {
    gen: {
      description: 'generate a password (--length=8..64, --upper --lower --numbers --symbols, =false to disable)',
      needsInput: false,
      run: (_input, flags) => {
        const length = flags.length === undefined ? core.DEFAULT_LENGTH : Number(flags.length);
        if (!Number.isInteger(length) || length < core.MIN_LENGTH || length > core.MAX_LENGTH) {
          throw new UsageError(`--length must be an integer between ${core.MIN_LENGTH} and ${core.MAX_LENGTH}`);
        }
        const opts = {
          lower: boolFlag(flags, 'lower', true),
          upper: boolFlag(flags, 'upper', true),
          numbers: boolFlag(flags, 'numbers', true),
          symbols: boolFlag(flags, 'symbols', false),
        };
        const { password, entropy, charsetSize } = core.generate(length, opts);
        return {
          text: password,
          json: { password, length, charsetSize, entropy: Number(entropy.toFixed(1)), entropyLabel: core.entropyLabel(entropy) },
        };
      },
    },
  },
};
