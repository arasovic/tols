import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true
    }),
    paths: {
      base: '/dev-utilities'
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
