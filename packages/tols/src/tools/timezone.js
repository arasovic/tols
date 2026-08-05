import * as core from '../core/timezone.js';
import { UsageError } from '../io.js';

export default {
  name: 'timezone',
  aliases: ['tz'],
  defaultAction: 'conv',
  actions: {
    conv: {
      description: 'convert a time between zones (--from, --to IANA names; defaults to now when no input)',
      optionalInput: true,
      run: (input, flags) => {
        const from = flags.from && String(flags.from);
        const to = flags.to && String(flags.to);
        if (!from || !to) {
          throw new UsageError('both --from and --to are required (IANA zone names)');
        }
        let date;
        if (input === '') {
          date = new Date();
        } else {
          date = new Date(input);
          if (isNaN(date.getTime())) throw new UsageError(`invalid date: ${input}`);
        }
        const r = core.convert(date, from, to);
        return {
          text: `from: ${r.from}  ${r.fromFormatted}\nto:   ${r.to}  ${r.toFormatted}\noffset: ${r.offset}h`,
          json: r,
        };
      },
    },
    zones: {
      description: 'show current time in the curated common zones',
      needsInput: false,
      run: () => {
        const rows = core.ZONES.map((z) => core.zoneNow(z.name));
        return {
          text: rows.map((r) => `${r.name}  ${r.time}  ${r.date}`).join('\n'),
          json: rows,
        };
      },
    },
  },
};
