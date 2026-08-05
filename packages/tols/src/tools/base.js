import * as core from '../core/base.js';

export default {
  name: 'base',
  defaultAction: 'conv',
  actions: {
    conv: {
      description: 'convert number between dec/bin/hex/oct (--from auto-detects 0x/0b/0o; --to=all|dec|bin|hex|oct)',
      run: (input, flags) => {
        const from = flags.from ?? undefined;
        const to = typeof flags.to === 'string' ? flags.to : 'all';
        const r = core.convert(input, { from });
        if (to !== 'all') {
          if (!(to in { dec: 1, bin: 1, hex: 1, oct: 1 })) {
            throw new Error(`unknown --to: ${to} (valid: all, dec, bin, hex, oct)`);
          }
          return { text: r[to], json: r };
        }
        return {
          text: `dec: ${r.dec}\nbin: ${r.bin}\nhex: ${r.hex}\noct: ${r.oct}`,
          json: r,
        };
      },
    },
  },
};
