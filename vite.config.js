import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  base: '/dev-utilities/',
  resolve: {
    // vitest does not apply the 'browser' condition by default; without it,
    // `import { onMount } from 'svelte'` resolves to svelte's SSR runtime
    // where lifecycle hooks are silent no-ops.
    conditions: ['browser']
  },
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
