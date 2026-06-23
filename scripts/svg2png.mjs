import sharp from 'sharp'
import { readFileSync } from 'node:fs'
for (const name of ['CLUTCH_live','CLUTCH_night']) {
  const svg = readFileSync(`public/icons/${name}_v3.svg`)
  await sharp(svg, { density: 600 })
    .resize(156, 156, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
    .png()
    .toFile(`public/icons/${name}.png`)
  console.log('✓', name+'.png')
}
