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
