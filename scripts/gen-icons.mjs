import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

mkdirSync('public/icons', { recursive: true })

const svg = (size, padding = 0) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="${padding ? 0 : 96}" fill="#0f5132"/>
  <g transform="translate(256 256)">
    <circle r="150" fill="none" stroke="#ffffff" stroke-width="22"/>
    <path d="M 20 -60 L 20 20 L -60 20" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 60 -20 L -20 -20 L -20 -90" fill="none" stroke="#7BE0A8" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`

const targets = [
  ['public/icons/icon-192.png', 192, false],
  ['public/icons/icon-512.png', 512, false],
  ['public/icons/icon-512-maskable.png', 512, true],
  ['public/apple-touch-icon.png', 180, false],
]

for (const [path, size, maskable] of targets) {
  await sharp(Buffer.from(svg(size, maskable)))
    .resize(size, size)
    .png()
    .toFile(path)
  console.log('wrote', path)
}

await sharp(Buffer.from(svg(64))).resize(64, 64).png().toFile('public/favicon.png')
console.log('done')
