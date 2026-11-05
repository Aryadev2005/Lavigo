import sharp from 'sharp'
import fs from 'node:fs'
const RAW = '../raw'
// [hash, outName, maxWidth, quality]
const jobs = [
  ['134394e8','logo',600,90],
  // hero slides
  ['b688fe1f','hero-nepal-bg',2000,72],['2a155acf','hero-nepal-fg',2000,78],['4e722fb4','thumb-nepal',160,80],
  ['d46b58f7','hero-sikkim-bg',2000,72],['7360fa41','hero-sikkim-fg',2000,78],['71d9cded','thumb-sikkim',160,80],
  ['8e55d156','hero-darjeeling-bg',2000,72],['8b042bab','thumb-darjeeling',160,80],
  ['4f01d2ad','hero-goa-bg',2000,72],['ee0dca06','thumb-goa',160,80],
  // cards / trip heroes
  ['dd3128a1','trip-nepal',1600,74],['568d9070','trip-darjeeling',1600,74],['52a9794a','trip-sikkim',1600,74],
  // gallery nepal
  ['a204b18e','nepal-1',1200,74],['f6e7d515','nepal-2',1200,74],['85ff9f90','nepal-3',1200,74],['d2264824','nepal-4',1200,74],
  ['59710ba8','nepal-5',1200,74],['46b40770','nepal-6',1200,74],['cffc6ce6','nepal-7',1200,74],
  // darjeeling
  ['02ebc923','darjeeling-1',1200,74],['7cc3028e','darjeeling-2',1200,74],['959a2cef','darjeeling-3',1200,74],['0fc60806','darjeeling-4',1200,74],
  ['c7f9465b','darjeeling-5',1200,74],['b3c79e75','darjeeling-6',1200,74],['0b23cbde','darjeeling-7',1200,74],['f67c0a3f','darjeeling-8',1200,74],
  // sikkim
  ['d1e4f97e','sikkim-1',1200,74],['976c8bd2','sikkim-2',1200,74],['753f544c','sikkim-3',1200,74],['dac65186','sikkim-4',1200,74],
  ['c0a55147','sikkim-5',1200,74],['67e35b88','sikkim-6',1200,74],['c8ddc817','sikkim-7',1200,74],['192025d2','sikkim-8',1200,74],['3d9f36fd','sikkim-9',1200,74],
  // goa
  ['9d637474','goa-1',1200,74],['e46cff96','goa-2',1200,74],['0a703886','goa-3',1200,74],['b8cd58a3','goa-4',1200,74],
  // dest cards (reuse)
  ['c8318c77','dest-sikkim',900,74],['ee0288c4','dest-goa',900,74],
]
let before=0, after=0
for (const [h,name,w,q] of jobs) {
  const f = fs.readdirSync(RAW).find(x=>x.startsWith(h+'.'))
  if(!f){console.log('missing',h);continue}
  const buf = fs.readFileSync(`${RAW}/${f}`); before+=buf.length
  const out = `public/img/${name}.webp`
  const info = await sharp(buf).resize({width:w,withoutEnlargement:true}).webp({quality:q,alphaQuality:90}).toFile(out)
  after+=info.size
}
console.log('images',jobs.length,'before',(before/1024).toFixed(0)+'KB','after',(after/1024).toFixed(0)+'KB')
