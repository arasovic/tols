import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const staticDir = path.join(process.cwd(), 'static');

const favicon16SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0c"/>
      <stop offset="100%" stop-color="#141416"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="18" fill="url(#bg)"/>
  <g fill="none" stroke="url(#accent)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M35 30 L20 50 L35 70"/>
    <path d="M65 30 L80 50 L65 70"/>
    <path d="M55 25 L45 75"/>
  </g>
</svg>`;

const favicon32SVG = favicon16SVG;

const appleTouchSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0c"/>
      <stop offset="100%" stop-color="#141416"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="180" height="180" rx="32" fill="url(#bg)"/>
  <g fill="none" stroke="url(#accent)" stroke-width="18" stroke-linecap="round" stroke-linejoin="round">
    <path d="M63 54 L36 90 L63 126"/>
    <path d="M117 54 L144 90 L117 126"/>
    <path d="M99 45 L81 135"/>
  </g>
</svg>`;

const ogImageSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0c"/>
      <stop offset="100%" stop-color="#141416"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g transform="translate(600, 280)">
    <g fill="none" stroke="url(#accent)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round">
      <path d="M-60 -60 L-100 0 L-60 60"/>
      <path d="M60 -60 L100 0 L60 60"/>
      <path d="M30 -70 L-30 70"/>
    </g>
  </g>
  <text x="600" y="420" text-anchor="middle" fill="#e5e5e5" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="600">DevUtils</text>
  <text x="600" y="470" text-anchor="middle" fill="#a3a3a3" font-family="system-ui, -apple-system, sans-serif" font-size="24">Developer Utilities for Everyday Tasks</text>
</svg>`;

async function generatePNG(svgString, outputPath, width, height) {
  const buffer = Buffer.from(svgString);
  await sharp(buffer)
    .resize(width, height)
    .png()
    .toFile(outputPath);
  console.log(`Generated: ${outputPath}`);
}

async function main() {
  await generatePNG(favicon16SVG, path.join(staticDir, 'favicon-16x16.png'), 16, 16);
  await generatePNG(favicon32SVG, path.join(staticDir, 'favicon-32x32.png'), 32, 32);
  await generatePNG(appleTouchSVG, path.join(staticDir, 'apple-touch-icon.png'), 180, 180);

  fs.writeFileSync(path.join(staticDir, 'og-image.svg'), ogImageSVG);
  console.log('Generated: og-image.svg');
}

main().catch(console.error);
