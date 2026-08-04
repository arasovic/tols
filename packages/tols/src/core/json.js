/**
 * JSON core — behavior ported from apps/web JsonTool.svelte.
 * Error messages carry line/column computed from V8's position hint.
 */

export function parse(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(describeError(e, text));
  }
}

export function format(text, indent = 2) {
  return JSON.stringify(parse(text), null, indent);
}

export function minify(text) {
  return JSON.stringify(parse(text));
}

export function validate(text) {
  try {
    parse(text);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e.message };
  }
}

function describeError(e, input) {
  const match = e.message.match(/position (\d+)/i);
  if (match) {
    const position = parseInt(match[1]);
    const lines = input.substring(0, position).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    return `Invalid JSON at line ${line}, column ${column}`;
  }
  return 'Invalid JSON: ' + e.message;
}
