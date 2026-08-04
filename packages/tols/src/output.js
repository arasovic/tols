/**
 * Output contract: stdout carries only results; errors go to stderr.
 * In --json mode everything (including errors) is a JSON envelope on stdout.
 */
export function emit(stdout, value, { json } = {}) {
  if (json) {
    const payload = typeof value === 'object' && value !== null && 'json' in value ? value.json : value;
    stdout.write(JSON.stringify({ ok: true, result: payload }) + '\n');
  } else {
    const text = typeof value === 'string' ? value : value?.text;
    if (typeof text !== 'string') throw new Error('tool returned no printable result');
    stdout.write(text + '\n');
  }
}

export function fail(stderr, stdout, message, { json } = {}, exitCode = 1) {
  if (json) stdout.write(JSON.stringify({ ok: false, error: message }) + '\n');
  else stderr.write(`tols: ${message}\n`);
  return exitCode;
}
