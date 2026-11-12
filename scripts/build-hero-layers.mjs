// Builds the home hero's parallax layers from the AI images in public/img/hero:
//   master.png  – the full scene (all colour comes from here, so layers line up exactly)
//   Layer1.png  – clean sky
//   Layer2/3/4  – peaks / foothills / forest on flat green, used only as masks
// Each mask's top edge is found per column and everything below it is filled solid from the master,
// so a layer never has holes where the generator left something out.
// Output: public/img/hero/{sky,peaks,hills,forest}.webp (already optimised, so the hero serves them unoptimized)
// Run: node scripts/build-hero-layers.mjs
import sharp from 'sharp'

const DIR = 'public/img/hero'
const master = sharp(`${DIR}/master.png`).removeAlpha()
const { width: W, height: H } = await master.metadata()
const base = await master.raw().toBuffer()

const rgb = (file) => sharp(`${DIR}/${file}`).removeAlpha().resize(W, H, { fit: 'fill' }).raw().toBuffer()

/** 0 on the green screen, 1 on the subject, soft in between (handles JPEG-ish noise and anti-aliasing). */
const matte = (buf, i) => {
  const g = buf[i + 1] - Math.max(buf[i], buf[i + 2])
  return g > 90 ? 0 : g < 30 ? 1 : 1 - (g - 30) / 60
}

async function layer(file, out) {
  const m = await rgb(file)
  const px = Buffer.alloc(W * H * 4)
  // the first row in each column where the subject starts and stays (ignores stray specks above it)
  const tops = Array.from({ length: W }, (_, x) => {
    for (let y = 0; y < H - 3; y++) if ([0, 1, 2, 3].every((k) => matte(m, ((y + k) * W + x) * 3) > 0.5)) return y
    return -1
  })
  // columns the mask missed (e.g. it stops short of the frame edge) borrow the nearest column's edge,
  // so the layer still runs edge to edge in the master's own colours instead of leaving a seam
  const found = tops.map((t, x) => (t < 0 ? -1 : x)).filter((x) => x >= 0)
  for (let x = 0; x < W; x++) {
    let top = tops[x]
    if (top < 0 && found.length) top = tops[found.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a))]
    const own = tops[x] >= 0
    for (let y = 0; y < H; y++) {
      const i = (y * W + x) * 3
      const o = (y * W + x) * 4
      const a = top < 0 ? 0 : y >= top ? 1 : own && y >= top - 3 ? matte(m, i) : 0
      px[o] = base[i]; px[o + 1] = base[i + 1]; px[o + 2] = base[i + 2]; px[o + 3] = Math.round(a * 255)
    }
  }
  await sharp(px, { raw: { width: W, height: H, channels: 4 } }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(`${DIR}/${out}`)
  return out
}

await sharp(`${DIR}/Layer1.png`).removeAlpha().resize(W, H, { fit: 'fill' }).webp({ quality: 80, effort: 6 }).toFile(`${DIR}/sky.webp`)
console.log('sky.webp', await layer('Layer2.png', 'peaks.webp'), await layer('layer3.png', 'hills.webp'), await layer('layer4.png', 'forest.webp'), `${W}x${H}`)
