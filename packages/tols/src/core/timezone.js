/**
 * Timezone core — behavior ported from apps/web TimezoneTool.svelte.
 * Same toLocaleString wall-clock diff technique and curated zone list.
 */

export const ZONES = [
  { name: 'UTC', offset: '+00:00' },
  { name: 'America/New_York', label: 'New York' },
  { name: 'America/Los_Angeles', label: 'Los Angeles' },
  { name: 'America/Chicago', label: 'Chicago' },
  { name: 'Europe/London', label: 'London' },
  { name: 'Europe/Paris', label: 'Paris' },
  { name: 'Europe/Berlin', label: 'Berlin' },
  { name: 'Asia/Tokyo', label: 'Tokyo' },
  { name: 'Asia/Shanghai', label: 'Shanghai' },
  { name: 'Asia/Singapore', label: 'Singapore' },
  { name: 'Asia/Dubai', label: 'Dubai' },
  { name: 'Australia/Sydney', label: 'Sydney' },
  { name: 'Pacific/Auckland', label: 'Auckland' },
];

/** Throws a stable error for unknown IANA zone names. */
export function validateZone(zone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
  } catch {
    throw new Error(`unknown time zone: ${zone}`);
  }
  return zone;
}

/**
 * Convert a date's wall-clock time between zones (web parity: the
 * toLocaleString round-trip trick, DST-aware for the given instant).
 * @param {Date} date
 * @param {string} fromZone
 * @param {string} toZone
 */
export function convert(date, fromZone, toZone) {
  validateZone(fromZone);
  validateZone(toZone);
  if (isNaN(date.getTime())) throw new Error(`invalid date: ${date}`);
  const fromTime = new Date(date.toLocaleString('en-US', { timeZone: fromZone }));
  const toTime = new Date(date.toLocaleString('en-US', { timeZone: toZone }));
  const diffHours = (toTime.getTime() - fromTime.getTime()) / (1000 * 60 * 60);
  return {
    from: fromZone,
    to: toZone,
    fromFormatted: formatFull(date, fromZone),
    toFormatted: formatFull(date, toZone),
    offsetHours: Number(diffHours.toFixed(1)),
    offset: diffHours >= 0 ? `+${diffHours.toFixed(1)}` : diffHours.toFixed(1),
  };
}

/**
 * True when the input carries its own UTC designator or numeric offset
 * (Z, +03:00, -0500...), i.e. it already pins an instant.
 * @param {string} input
 */
export function hasExplicitOffset(input) {
  const t = String(input).trim();
  return /Z$/i.test(t) || /[+-]\d{2}:?\d{2}$/.test(t);
}

/**
 * Parse canonical wall-clock fields: 2026-01-15[T ]12:00[:00].
 * Returns null for anything freer-form.
 * @param {string} input
 */
export function parseWallFields(input) {
  const m = String(input)
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: +m[4], mi: +m[5], s: +(m[6] ?? 0) };
}

/** Wall-clock offset (ms) of a zone at a given instant. */
function wallOffset(instantMs, zone) {
  const wall = new Date(new Date(instantMs).toLocaleString('en-US', { timeZone: zone })).getTime();
  return wall - instantMs;
}

/**
 * Interpret zone-less wall-clock fields as a time in `zone` and return the
 * corresponding instant (two-pass offset refinement, DST-aware).
 * @param {{ y: number, mo: number, d: number, h: number, mi: number, s: number }} f
 * @param {string} zone
 * @returns {Date}
 */
export function wallTimeInZone(f, zone) {
  validateZone(zone);
  let guess = Date.UTC(f.y, f.mo - 1, f.d, f.h, f.mi, f.s);
  for (let i = 0; i < 2; i++) {
    guess = Date.UTC(f.y, f.mo - 1, f.d, f.h, f.mi, f.s) - wallOffset(guess, zone);
  }
  return new Date(guess);
}

/** @param {Date} date @param {string} zone */
export function formatFull(date, zone) {
  return date.toLocaleString('en-US', {
    timeZone: zone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Current wall-clock time in a zone (web's common-zones panel). */
export function zoneNow(zone, now = new Date()) {
  validateZone(zone);
  return {
    name: ZONES.find((z) => z.name === zone)?.label ?? zone,
    time: now.toLocaleString('en-US', { timeZone: zone, hour: '2-digit', minute: '2-digit' }),
    date: now.toLocaleString('en-US', { timeZone: zone, month: 'short', day: 'numeric' }),
  };
}
