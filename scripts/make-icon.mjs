import sharp from 'sharp'
const ICON = 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 595.28 841.89">
<path fill="#EB6BB0" d="M396.855,297.445l25.914-25.91l-88.667-88.659l-25.91,25.91l-1.953,78.437l-20.88,0.698l2.087-83.824c0.069-2.675,1.157-5.225,3.053-7.117l36.227-36.23c4.076-4.076,10.682-4.076,14.753,0l103.418,103.413c4.072,4.068,4.072,10.673,0,14.746l-36.238,36.238c-1.893,1.892-4.438,2.98-7.113,3.045l-207.947,5.188l-25.91,25.91l88.664,88.66l25.914-25.918l1.945-77.966l20.872-0.341l-2.066,83c-0.069,2.68-1.157,5.221-3.057,7.121l-36.23,36.23c-4.072,4.068-10.674,4.068-14.75,0L145.565,356.663c-4.072-4.076-4.072-10.678,0-14.754l36.234-36.23c1.892-1.892,4.438-2.988,7.117-3.053L396.855,297.445z"/>
<polygon fill="#77BC1F" points="256.352,420.249 269.879,406.729 270.817,368.672 204.856,368.672 "/>
<polygon fill="#77BC1F" points="318.768,286.874 391.545,285.063 405.073,271.535 390.79,257.31 319.503,257.31 "/>
</svg>`
// 1. fond exact = pixel coin de l'icône actuelle (on "garde le fond")
const px = await sharp(ICON).extract({left:3,top:3,width:1,height:1}).raw().toBuffer()
const bg = { r:px[0], g:px[1], b:px[2], alpha:1 }
// 2. rendre le logo (transparent) puis rogner sur sa boîte englobante
const rendered = await sharp(Buffer.from(svg), { density: 500 }).png().toBuffer()
const trimmed  = await sharp(rendered).trim().png().toBuffer()
const fitted   = await sharp(trimmed).resize(720, 720, { fit:'inside' }).png().toBuffer()
// 3. composer au centre sur le fond
await sharp({ create:{ width:1024, height:1024, channels:4, background:bg } })
  .composite([{ input: fitted, gravity:'center' }]).png().toFile(ICON+'.tmp')
await sharp(ICON+'.tmp').toFile(ICON)
import('fs').then(fs=>fs.unlinkSync(ICON+'.tmp'))
console.log('✅ icône régénérée · fond conservé rgb('+bg.r+','+bg.g+','+bg.b+')')
