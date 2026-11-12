'use client'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import ShinyText from './ShinyText'

// Home landing scene (photo parallax layers), falling leaves, the lavender accent, and the small SVG
// drawing helpers the destination scenes reuse.

// tiny deterministic random so server and browser draw the same trees and leaves
export function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** A natural ridgeline between two points (midpoint displacement), closed down to the bottom. */
export function ridge(seed: number, pts: [number, number][], rough: number, depth = 6, close = true) {
  const r = rng(seed)
  let line = pts
  let amp = rough
  for (let k = 0; k < depth; k++) {
    const next: [number, number][] = []
    for (let i = 0; i < line.length - 1; i++) {
      const [x0, y0] = line[i]
      const [x1, y1] = line[i + 1]
      next.push([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + (r() - 0.5) * amp])
    }
    next.push(line[line.length - 1])
    line = next
    amp *= 0.55
  }
  return 'M' + line.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join(' L') + (close ? ' L1640 1000 L-40 1000 Z' : ' Z')
}

/** A row of pine trees as one SVG path, standing on a gently rolling ground line. */
export function pines(seed: number, base: number, minH: number, maxH: number, gap: number) {
  const r = rng(seed)
  let d = ''
  let x = -30
  while (x < 1650) {
    const h = minH + r() * (maxH - minH)
    const w = h * (0.34 + r() * 0.1)
    const cx = x + w / 2
    const y0 = base + Math.sin(x / 170) * 12 + r() * 8
    const tiers = 4 + Math.floor(r() * 2)
    // left side up, tier by tier, then the right side back down
    const left: string[] = []
    const right: string[] = []
    for (let t = 0; t < tiers; t++) {
      const yb = y0 - h * 0.08 - (h * 0.86 * t) / tiers
      const tw = w * (1 - (t / tiers) * 0.82)
      const lift = h * 0.86 / tiers * 0.55
      left.push(`L${(cx - tw / 2).toFixed(0)} ${yb.toFixed(0)} L${(cx - tw * 0.16).toFixed(0)} ${(yb - lift).toFixed(0)}`)
      right.unshift(`L${(cx + tw * 0.16).toFixed(0)} ${(yb - lift).toFixed(0)} L${(cx + tw / 2).toFixed(0)} ${yb.toFixed(0)}`)
    }
    d += `M${(cx - w * 0.06).toFixed(0)} ${(y0 + 40).toFixed(0)} L${(cx - w * 0.06).toFixed(0)} ${(y0 - h * 0.08).toFixed(0)} ${left.join(' ')} L${cx.toFixed(0)} ${(y0 - h).toFixed(0)} ${right.join(' ')} L${(cx + w * 0.06).toFixed(0)} ${(y0 - h * 0.08).toFixed(0)} L${(cx + w * 0.06).toFixed(0)} ${(y0 + 40).toFixed(0)} Z `
    x += w * (0.55 + r() * 0.5) + gap * r()
  }
  // ground under the trees
  return d + `M-40 ${base + 8} Q400 ${base - 10} 800 ${base + 6} T1640 ${base} L1640 1000 L-40 1000 Z`
}

const LEAF_PATHS = [
  'M0 -10 C6 -6 8 2 0 10 C-8 2 -6 -6 0 -10 Z',                         // simple oval leaf
  'M0 -11 C9 -9 10 3 0 11 C-3 5 -9 0 -6 -6 C-4 -9 -2 -10 0 -11 Z',      // lopsided leaf
  'M0 -10 L3 -4 L9 -5 L5 0 L9 6 L2 4 L0 10 L-2 4 L-9 6 L-5 0 L-9 -5 L-3 -4 Z', // maple-ish
]
const LEAF_COLOURS = ['#B4472E', '#C8692F', '#D99A3C', '#8E3B2A', '#7FA86A', '#A8573A']

// Photographic layers of one Himalayan dawn (built by scripts/build-hero-layers.mjs), each drifting at its own
// depth with scroll and the pointer, with mist between them. Same object-position on every layer keeps them aligned.
const PLANES = [
  { src: '/img/hero/sky.webp', cls: 'lv-p-sky' },
  { src: '/img/hero/peaks.webp', cls: 'lv-p-peaks' },
  { src: '/img/hero/hills.webp', cls: 'lv-p-hills' },
  { src: '/img/hero/forest.webp', cls: 'lv-p-forest' },
]

export function HeroScene() {
  const ref = useRef<HTMLDivElement>(null)

  // one pair of CSS variables drives every plane: --sy (scroll) and --mx/--my (pointer, -1…1, eased)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const target = { x: 0, y: 0 }
    const now = { x: 0, y: 0 }
    const frame = () => {
      now.x += (target.x - now.x) * 0.06
      now.y += (target.y - now.y) * 0.06
      el.style.setProperty('--sy', String(Math.min(window.scrollY, 1200)))
      el.style.setProperty('--mx', now.x.toFixed(4))
      el.style.setProperty('--my', now.y.toFixed(4))
      raf = Math.abs(target.x - now.x) + Math.abs(target.y - now.y) > 0.001 ? requestAnimationFrame(frame) : 0
    }
    const wake = () => { if (!raf) raf = requestAnimationFrame(frame) }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = (e.clientY / window.innerHeight) * 2 - 1
      wake()
    }
    frame()
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => { window.removeEventListener('scroll', wake); window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf) }
  }, [])

  const plane = (i: number) => (
    <div key={PLANES[i].cls} className={'lv-plane ' + PLANES[i].cls}>
      <Image src={PLANES[i].src} alt="" fill priority unoptimized />
    </div>
  )

  return (
    <div className="lv-scene" ref={ref} aria-hidden="true">
      {plane(0)}
      <div className="lv-glow" />
      {plane(1)}
      <div className="lv-mist lv-m1" />
      {plane(2)}
      <div className="lv-mist lv-m2" />
      {plane(3)}
      <div className="lv-mist lv-m4" />
    </div>
  )
}

/** Leaves drifting down over the hero and the section below it (decorative, hidden from screen readers). */
export function FallingLeaves() {
  const r = rng(7)
  const leaves = Array.from({ length: 14 }, (_, i) => ({
    path: LEAF_PATHS[i % LEAF_PATHS.length],
    colour: LEAF_COLOURS[Math.floor(r() * LEAF_COLOURS.length)],
    left: 4 + r() * 92,
    size: 18 + r() * 18,
    dur: 11 + r() * 10,
    delay: -r() * 20,
    sway: 30 + r() * 70,
    spin: (r() > 0.5 ? 1 : -1) * (180 + r() * 360),
    mobile: i % 2 === 0,
  }))

  return (
      <div className="lv-leaves" aria-hidden="true">
      {leaves.map((l, i) => (
        <span
          key={i}
          className={'lv-leaf' + (l.mobile ? '' : ' lv-leaf-wide')}
          style={{
            left: `${l.left}%`,
            ['--dur' as string]: `${l.dur}s`,
            ['--delay' as string]: `${l.delay}s`,
            ['--sway' as string]: `${l.sway}px`,
            ['--spin' as string]: `${l.spin}deg`,
          }}
        >
          <svg viewBox="-12 -12 24 24" width={l.size} height={l.size} focusable="false">
            <path d={l.path} fill={l.colour} />
            <path d="M0 -9 L0 9" stroke="rgba(0,0,0,.18)" strokeWidth=".8" />
          </svg>
        </span>
      ))}
    </div>
  )
}

/** Turns "Mountains *are calling.*" into normal text with the starred part in an italic accent that a slow sheen crosses.
 *  tone="dark" (default, light pages): violet with a lavender shine. tone="light" (over the hero photo): sunrise gold. */
const TONES = { dark: { color: '#6042AE', shine: '#C9B5F4' }, light: { color: '#FFC56B', shine: '#FFF4DC' } }
export function Accent({ text, tone = 'dark' }: { text: string; tone?: keyof typeof TONES }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean)
  const t = TONES[tone]
  return <>{parts.map((p, i) => (p.startsWith('*') && p.endsWith('*')
    ? <em key={i} className={'lv-accent lv-accent-' + tone}><ShinyText text={p.slice(1, -1)} color={t.color} shineColor={t.shine} speed={1.8} delay={2.2} shineWidth={60} softness={0.6} glow={0.8} angle={110} /></em>
    : <span key={i}>{p}</span>))}</>
}
