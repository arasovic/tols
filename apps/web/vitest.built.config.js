import { defineConfig } from 'vitest/config'

/**
 * Config for the guards that read `build/`.
 *
 * They live outside `tests/` and run under `npm run test:built`, so `npm test`
 * never depends on a build having happened. No SvelteKit plugin and no jsdom:
 * these read files off disk, nothing renders.
 */
export default defineConfig({
  test: {
    include: ['tests-built/**/*.test.js'],
    environment: 'node'
  }
})
