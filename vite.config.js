import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  base: '/dev-utilities/',
  // Vitest only: apply the 'browser' condition so `import { onMount } from
  // 'svelte'` resolves to the DOM runtime. Without it svelte resolves to its
  // SSR runtime where lifecycle hooks are silent no-ops. Must NOT apply to
  // production builds: it would constant-fold esm-env's BROWSER flag to true
  // in the SSR bundle and leak `window` references into server chunks.
  ...(process.env.VITEST ? { resolve: { conditions: ['browser'] } } : {}),
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
    server: {
      deps: {
        inline: [/svelte/]
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 2
      }
    }
  }
})
