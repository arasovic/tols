/**
 * Timestamp core — behavior ported from apps/web TimestampTool.svelte.
 * tz handling: 'local' uses the system locale; anything else is an IANA zone.
 */

export function formatDate(date, tz) {
  if (!tz || tz === 'local' || tz === 'Local') {
    return date.toLocaleString();
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  } catch {
    return date.toISOString() + ' (UTC - timezone error)';
  }
}

/**
 * Convert a unix timestamp (seconds or milliseconds autodetected) or a date
 * string into human-readable forms.
 */
export function toHuman(input, tz = 'UTC') {
  const trimmed = String(input).trim();
  let timestamp;

  const isAllDigits = /^-?\d+$/.test(trimmed);
  const isReasonableLength = trimmed.length >= 1 && trimmed.length <= 16;

  if (isAllDigits && isReasonableLength) {
    timestamp = parseInt(trimmed, 10);
    // values between 1e10 and 1e16 are treated as milliseconds
    const isMilliseconds = timestamp > 1e10 && timestamp < 1e16;
    if (isMilliseconds) timestamp = timestamp / 1000;
  } else {
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      timestamp = parsedDate.getTime() / 1000;
    } else {
      timestamp = NaN;
    }
  }

  if (isNaN(timestamp) || !isFinite(timestamp)) {
    throw new Error('Invalid timestamp format');
  }

  const date = new Date(timestamp * 1000);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date from timestamp');
  }

  return {
    formatted: formatDate(date, tz),
    iso: date.toISOString(),
    relative: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    utc: date.toUTCString(),
  };
}

/** Convert a date string into unix seconds/milliseconds/ISO. */
export function toUnix(input) {
  const date = new Date(String(input).trim());
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return {
    unix: Math.floor(date.getTime() / 1000),
    unixMs: date.getTime(),
    iso: date.toISOString(),
  };
}

export function now() {
  const ms = Date.now();
  return { unix: Math.floor(ms / 1000), unixMs: ms, iso: new Date(ms).toISOString() };
}
