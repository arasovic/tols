const tools = new Map();

export function register(def) {
  if (tools.has(def.name)) throw new Error(`duplicate tool name: ${def.name}`);
  tools.set(def.name, def);
  for (const a of def.aliases ?? []) {
    if (tools.has(a)) throw new Error(`duplicate tool alias: ${a} (${def.name})`);
    tools.set(a, def);
  }
}

export function find(nameOrAlias) {
  return tools.get(nameOrAlias);
}

export function list() {
  const seen = new Set();
  return [...tools.values()].filter((t) => (seen.has(t) ? false : (seen.add(t), true)));
}

export function clear() {
  tools.clear();
}
