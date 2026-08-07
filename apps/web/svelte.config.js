import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  // Legacy component API (Svelte 4-style classes with $on/$set). Temporary
  // compatibility shim for the existing Svelte 4 component files and their
  // tests until the redesign migrates them to runes. See ADR-0004.
  compilerOptions: {
    compatibility: {
      componentApi: 4
    }
  },
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    paths: {
      base: ''
    },
    prerender: {
      handleMissingId: 'ignore',
      handleHttpError: ({ path, message }) => {
        // Ignore errors for tool routes during prerender
        if (path.startsWith('/json') || path.startsWith('/base64') || path.startsWith('/url') ||
            path.startsWith('/uuid') || path.startsWith('/hash') || path.startsWith('/jwt') ||
            path.startsWith('/color') || path.startsWith('/timestamp') || path.startsWith('/regex') ||
            path.startsWith('/lorem') || path.startsWith('/sitemap.xml')) {
          return
        }
        console.warn(message)
      }
    }
  }
}

export default config
