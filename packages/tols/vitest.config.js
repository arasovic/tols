import { defineConfig } from 'vitest/config';

// Pin the timezone in the main process BEFORE workers spawn. Worker threads
// resolve their timezone from the host at thread creation and ignore runtime
// process.env.TZ changes, so the vitest `env` option alone is insufficient.
if (process.env.VITEST) process.env.TZ = 'UTC';

export default defineConfig({
  test: {
    environment: 'node',
    env: { TZ: 'UTC' },
  },
});
