import sharp from 'sharp'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = join(__dirname, '../public/icons/icon-source.png')
const outDir = join(__dirname, '../public/icons')

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(join(outDir, `icon-${size}x${size}.png`))
  console.log(`Generated icon-${size}x${size}.png`)
}

// Also generate apple-touch-icon (180x180)
await sharp(src)
  .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile(join(outDir, 'apple-touch-icon.png'))
console.log('Generated apple-touch-icon.png')

// favicon 32x32
await sharp(src)
  .resize(32, 32)
  .png()
  .toFile(join(__dirname, '../public/favicon-32x32.png'))
console.log('Generated favicon-32x32.png')

// favicon 16x16
await sharp(src)
  .resize(16, 16)
  .png()
  .toFile(join(__dirname, '../public/favicon-16x16.png'))
console.log('Generated favicon-16x16.png')

console.log('All icons generated!')
