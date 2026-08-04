import * as core from '../core/timestamp.js';

function kvText(obj) {
  return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join('\n');
}

export default {
  name: 'timestamp',
  aliases: ['ts'],
  defaultAction: 'conv',
  actions: {
    now: {
      description: 'current time as unix seconds/ms/ISO',
      needsInput: false,
      run: (_input, flags) => {
        const r = core.now();
        return { text: kvText(r), json: r };
      },
    },
    conv: {
      description: 'autodetect: number -> human (--tz=ZONE), date string -> unix',
      run: (input, flags) => {
        const trimmed = input.trim();
        if (/^-?\d+$/.test(trimmed)) {
          const r = core.toHuman(trimmed, flags.tz ?? 'UTC');
          return { text: kvText(r), json: r };
        }
        const r = core.toUnix(trimmed);
        return { text: kvText(r), json: r };
      },
    },
    parse: {
      description: 'date string -> unix seconds/ms/ISO',
      run: (input) => {
        const r = core.toUnix(input);
        return { text: kvText(r), json: r };
      },
    },
  },
};
