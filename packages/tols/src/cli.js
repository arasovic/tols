import { createRequire } from 'node:module';
import { resolveInput, UsageError } from './io.js';
import { emit, fail } from './output.js';
import { find, list } from './registry.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

/**
 * Tool definition shape:
 * {
 *   name: 'base64',
 *   aliases: ['b64'],
 *   defaultAction: 'enc',
 *   actions: {
 *     enc: { description, needsInput?: bool, run(input, flags) -> string | { text, json } },
 *   },
 * }
 */
export async function run(argv, { stdin = process.stdin, stdout = process.stdout, stderr = process.stderr } = {}) {
  const json = argv.includes('--json');
  const flags = {};
  const rest = [];
  for (const a of argv) {
    if (a === '--json') continue;
    if (a.startsWith('--')) {
      const [k, ...v] = a.slice(2).split('=');
      flags[k] = v.length ? v.join('=') : true;
    } else {
      rest.push(a);
    }
  }

  if (flags.version) {
    stdout.write(version + '\n');
    return 0;
  }

  const [toolName, second, ...tail] = rest;

  if (!toolName) {
    stderr.write(usageText());
    return 2;
  }
  if (toolName === 'help') {
    stdout.write(usageText());
    return 0;
  }

  const tool = find(toolName);
  if (!tool) return fail(stderr, stdout, `unknown tool: ${toolName} (try: tols help)`, { json }, 2);

  if (second === 'help') {
    stdout.write(toolHelpText(tool));
    return 0;
  }

  const hasAction = second !== undefined && tool.actions[second] !== undefined;
  const actionName = hasAction ? second : tool.defaultAction;
  const inputArgs = hasAction ? tail : rest.slice(1);

  if (!actionName || !tool.actions[actionName]) {
    const valid = Object.keys(tool.actions).join(', ');
    return fail(stderr, stdout, `unknown action for ${tool.name}: ${second ?? '(none)'} (valid: ${valid})`, { json }, 2);
  }

  const action = tool.actions[actionName];
  try {
    const input = action.needsInput === false ? '' : await resolveInput(inputArgs, { stdin, isTTY: stdin.isTTY });
    const result = await action.run(input, flags);
    emit(stdout, result, { json });
    return 0;
  } catch (e) {
    const code = e instanceof UsageError ? 2 : 1;
    return fail(stderr, stdout, `${tool.name}: ${e.message}`, { json }, code);
  }
}

function usageText() {
  const lines = ['tols — dev utilities in your terminal', '', 'usage: tols <tool> <action> [input] [flags]', '       tols <tool> help', '', 'tools:'];
  for (const t of list()) {
    const aliases = t.aliases?.length ? ` (${t.aliases.join(', ')})` : '';
    lines.push(`  ${t.name}${aliases}  —  ${Object.keys(t.actions).join(', ')}`);
  }
  lines.push('', 'input: positional args, piped stdin, or @<file>', 'flags: --json (machine output), --<name>[=<value>] per tool');
  return lines.join('\n') + '\n';
}

function toolHelpText(tool) {
  const lines = [`tols ${tool.name} — actions:`];
  for (const [name, a] of Object.entries(tool.actions)) {
    const def = tool.defaultAction === name ? ' (default)' : '';
    lines.push(`  ${name}${def}  —  ${a.description ?? ''}`);
  }
  return lines.join('\n') + '\n';
}
