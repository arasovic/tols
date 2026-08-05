import * as core from '../core/qrcode.js';

export default {
  name: 'qrcode',
  aliases: ['qr'],
  defaultAction: 'gen',
  actions: {
    gen: {
      description: 'encode text as a QR code (--ec=L|M|Q|H default M; half-block render, --ascii for plain chars, --quiet=N margin)',
      run: (input, flags) => {
        const ecLevel = flags.ec === undefined ? 'M' : String(flags.ec).toUpperCase();
        if (!core.EC_LEVELS.includes(ecLevel)) {
          throw new Error(`unknown --ec: ${flags.ec} (valid: L, M, Q, H)`);
        }
        const { matrix, size, version, mode, mask } = core.generateMatrix(input, { ecLevel });
        const ascii = Boolean(flags.ascii);
        const quiet = flags.quiet === undefined ? 2 : Number(flags.quiet);
        if (!Number.isInteger(quiet) || quiet < 0) throw new Error(`invalid --quiet: ${flags.quiet}`);
        const text = core.renderText(matrix, { ascii, quiet });
        return {
          text,
          json: { version, size, mode: modeName(mode), ecLevel, mask, quiet, render: ascii ? 'ascii' : 'half-block', text },
        };
      },
    },
  },
};

function modeName(mode) {
  if (mode === core.MODE_NUMERIC) return 'numeric';
  if (mode === core.MODE_ALPHANUMERIC) return 'alphanumeric';
  return 'byte';
}
