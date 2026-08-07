import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vitest/config'

// Vitest only: pin the timezone in the main process BEFORE workers spawn.
// Worker threads resolve their timezone from the host at thread creation and
// ignore runtime process.env.TZ changes, so the vitest `env` option alone is
// insufficient. Must NOT apply to builds or dev servers.
if (process.env.VITEST) process.env.TZ = 'UTC'

export default defineConfig({
  plugins: [sveltekit()],
  base: '/',
  // Vitest only: apply the 'browser' condition so `import { onMount } from
  // 'svelte'` resolves to the DOM runtime. Without it svelte resolves to its
  // SSR runtime where lifecycle hooks are silent no-ops. Must NOT apply to
  // production builds: it would constant-fold esm-env's BROWSER flag to true
  // in the SSR bundle and leak `window` references into server chunks.
  ...(process.env.VITEST ? { resolve: { conditions: ['browser'] } } : {}),
  test: {
    env: { TZ: 'UTC' },
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
    server: {
      deps: {
        inline: [/svelte/]
      }
    },
    pool: 'threads'
  }
})
