'use client'
// Home landing scene: a warm Himalayan dusk drawn in SVG (sky, far range, a snow peak, a dark ridge,
// a pine forest), mist that drifts across, leaves that fall past, and gentle scroll parallax.
// Nothing to download but this file and a few CSS rules (app/theme.css), so it shows instantly.
// prefers-reduced-motion: no drifting, no falling leaves, no parallax (see theme.css).
import { useEffect, useRef } from 'react'

// tiny deterministic random so server and browser draw the same trees and leaves
function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** A natural ridgeline between two points (midpoint displacement), closed down to the bottom. */
function ridge(seed: number, pts: [number, number][], rough: number, depth = 6, close = true) {
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
  return 'M' + line.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join(' L') + (close ? ' L1640 640 L-40 640 Z' : ' Z')
}

/** A row of pine trees as one SVG path, standing on a gently rolling ground line. */
function pines(seed: number, base: number, minH: number, maxH: number, gap: number) {
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
  return d + `M-40 ${base + 8} Q400 ${base - 10} 800 ${base + 6} T1640 ${base} L1640 640 L-40 640 Z`
}

const LEAF_PATHS = [
  'M0 -10 C6 -6 8 2 0 10 C-8 2 -6 -6 0 -10 Z',                         // simple oval leaf
  'M0 -11 C9 -9 10 3 0 11 C-3 5 -9 0 -6 -6 C-4 -9 -2 -10 0 -11 Z',      // lopsided leaf
  'M0 -10 L3 -4 L9 -5 L5 0 L9 6 L2 4 L0 10 L-2 4 L-9 6 L-5 0 L-9 -5 L-3 -4 Z', // maple-ish
]
const LEAF_COLOURS = ['#B4472E', '#C8692F', '#D99A3C', '#8E3B2A', '#7FA86A', '#A8573A']

export function HeroScene() {
  const ref = useRef<HTMLDivElement>(null)

  // scroll parallax: one CSS variable, every layer moves at its own depth
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 1200)
        el.style.setProperty('--sy', String(y))
      })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf) }
  }, [])

  return (
    <div className="lv-scene" ref={ref} aria-hidden="true">
      <div className="lv-sky" />
      <div className="lv-sun" />

      <svg className="lv-layer lv-far" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={ridge(3, [[-40, 330], [260, 250], [520, 300], [800, 230], [1080, 290], [1340, 220], [1640, 280]], 90)} fill="#A69CB8" opacity=".7" />
      </svg>

      <svg className="lv-layer lv-peak" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" focusable="false">
        <defs>
          {/* snow above the snowline, blue-grey rock below it */}
          <linearGradient id="lvRange" x1="0" y1="80" x2="0" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFDF9" />
            <stop offset=".34" stopColor="#ECE8F0" />
            <stop offset=".43" stopColor="#8E94B2" />
            <stop offset="1" stopColor="#4A5174" />
          </linearGradient>
          <linearGradient id="lvShade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2E3555" stopOpacity="0" />
            <stop offset=".5" stopColor="#2E3555" stopOpacity=".28" />
            <stop offset="1" stopColor="#2E3555" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={ridge(9, [[-40, 430], [150, 300], [300, 120], [350, 70], [420, 150], [520, 270], [720, 330], [930, 190], [1080, 290], [1300, 240], [1640, 340]], 60)} fill="url(#lvRange)" />
        <path d={ridge(10, [[350, 72], [420, 160], [500, 262], [600, 330], [640, 640], [350, 640]], 36, 5, false)} fill="url(#lvShade)" />
      </svg>

      <div className="lv-mist lv-m1" />
      <div className="lv-mist lv-m2" />

      <svg className="lv-layer lv-ridge" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={ridge(21, [[-40, 450], [240, 390], [520, 430], [800, 370], [1060, 420], [1320, 380], [1640, 420]], 60)} fill="#3B4265" />
      </svg>

      <div className="lv-mist lv-m3" />

      <svg className="lv-layer lv-trees-back" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={pines(11, 520, 50, 105, 30)} fill="#2B2F4C" />
      </svg>
      <svg className="lv-layer lv-trees" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" focusable="false">
        <path d={pines(23, 600, 90, 200, 60)} fill="#191B2F" />
      </svg>

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

/** Turns "Mountains *are calling.*" into normal text with the starred part in the lavender italic. */
export function Accent({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g).filter(Boolean)
  return <>{parts.map((p, i) => (p.startsWith('*') && p.endsWith('*') ? <em key={i} className="lv-accent">{p.slice(1, -1)}</em> : <span key={i}>{p}</span>))}</>
}
