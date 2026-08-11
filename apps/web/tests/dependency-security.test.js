import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const requireFromKit = createRequire(
  require.resolve('@sveltejs/kit/package.json'),
)
const { serialize } = requireFromKit('cookie')

describe('transitive cookie hardening', () => {
  it('rejects cookie names that inject additional attributes', () => {
    expect(() =>
      serialize(
        "userName=<script>alert('xss')</script>; Max-Age=2592000; a",
        'value',
      ),
    ).toThrow()
  })
})
