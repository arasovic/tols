/**
 * Rasterises the shipped brand mark into the PNG sizes the app references.
 *
 * static/favicon.svg is the single source of truth: this script never carries
 * its own copy of the artwork, so the PNGs cannot drift away from the SVG.
 * Re-running it on an unchanged favicon.svg must produce no git diff.
 *
 * Paths resolve from this file, not process.cwd(), so it runs from anywhere.
 */
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const staticDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static')
const source = path.join(staticDir, 'favicon.svg')

const targets = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 }
]

async function main() {
  for (const { file, size } of targets) {
    await sharp(source).resize(size, size).png().toFile(path.join(staticDir, file))
    process.stdout.write(`Generated: ${file} (${size}x${size})\n`)
  }
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? error}\n`)
  process.exitCode = 1
})
