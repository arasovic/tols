/**
 * Rasterises the shipped brand artwork into the PNGs the app references.
 *
 * The SVGs in static/ are the single source of truth: this script never carries
 * its own copy of the artwork, so the PNGs cannot drift away from them.
 * Re-running it on unchanged SVGs must produce no git diff.
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

/**
 * The social preview has to ship as a PNG even though the artwork is vector.
 * No major platform rasterises an SVG for a link preview: Slack, Twitter,
 * LinkedIn, Facebook and iMessage all drop an `og:image` they cannot decode,
 * and the card renders with no image at all rather than falling back.
 *
 * 1200x630 is the artwork's own size and the size every platform crops to.
 */
const OG = { source: 'og-image.svg', file: 'og-image.png', width: 1200, height: 630 }

async function main() {
  for (const { file, size } of targets) {
    await sharp(source).resize(size, size).png().toFile(path.join(staticDir, file))
    process.stdout.write(`Generated: ${file} (${size}x${size})\n`)
  }

  // density raises the rasterisation DPI so the type is sampled above its final
  // size rather than at it; sharp's default 72 leaves the glyph edges soft.
  await sharp(path.join(staticDir, OG.source), { density: 144 })
    .resize(OG.width, OG.height)
    .png({ compressionLevel: 9 })
    .toFile(path.join(staticDir, OG.file))
  process.stdout.write(`Generated: ${OG.file} (${OG.width}x${OG.height})\n`)
}

main().catch((error) => {
  process.stderr.write(`${error?.stack ?? error}\n`)
  process.exitCode = 1
})
