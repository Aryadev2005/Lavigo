'use client'
// "Handpicked destinations": a full-screen scroll journey. The section is N screens tall and its stage
// sticks to the viewport; scrolling moves from one destination to the next, cross-fading between
// hand-drawn SVG landscapes (snow peaks for Nepal, palms and sunset sea for Goa…) whose layers drift
// at different depths. The details card for the current place sits on top.
// prefers-reduced-motion: still cross-fades, but no parallax and no falling snow / birds (see CSS).
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from './Icons'
import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { pines, ridge, rng } from './HeroScene'
import './DestinationJourney.css'

export type JourneyStop = {
  slug: string
  name: string
  area: string
  blurb: string
  places: string[]
  nights: number
  href: string
  plan: string
  price: string | null
  cta: string
  next: string | null
  from: string | null
  photos: { src: string; caption: string }[]
}

type Biome = 'snow' | 'tea' | 'plateau' | 'coast' | 'beach'

// destinations come from the admin, so pick the landscape from the words that describe the place
function biomeOf(s: JourneyStop): Biome {
  const t = `${s.slug} ${s.name} ${s.area}`.toLowerCase()
  if (/nepal|sikkim|gangtok|lachung|ladakh|leh|manali|spiti|kashmir|himachal|shimla|kedar|uttarakhand|bhutan|tawang|auli|himalaya|snow/.test(t)) return 'snow'
  if (/darjeeling|munnar|ooty|coorg|assam|kalimpong|mirik|tea/.test(t)) return 'tea'
  if (/goa|andaman|gokarna|varkala|kovalam|lakshadweep|pondicherry|puducherry|maldives|beach/.test(t)) return 'beach'
  if (/puri|konark|chilika|rameswaram|kanyakumari|vizag|digha|dwarka|coast|temple/.test(t)) return 'coast'
  return 'plateau'
}

const LABEL: Record<Biome, string> = { snow: 'Snow & peaks', tea: 'Tea gardens', plateau: 'Sunset hills', coast: 'Temple coast', beach: 'Sun & sea' }

// same jagged line as the bottom of the home hero, so the section reads as part of that landscape
const EDGE = 'M0 90 L0 52 L90 30 L170 58 L260 18 L350 50 L430 34 L520 64 L610 26 L700 56 L790 40 L880 66 L970 22 L1060 54 L1150 36 L1240 62 L1330 28 L1420 56 L1510 38 L1600 58 L1600 90 Z'

const seedOf =(s: string) => [...s].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0

/* ---------- drawing helpers (viewBox 1600×600, anchored to the bottom of the screen) ---------- */

const css = (o: Record<string, string | number>) => o as CSSProperties

function L({ d, children, cls = '' }: { d: number; children: ReactNode; cls?: string }) {
  return (
    <svg className={'dj-l ' + cls} style={css({ '--d': d })} viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" focusable="false">
      {children}
    </svg>
  )
}
const Sky = ({ g }: { g: string }) => <div className="dj-sky" style={{ background: g }} />
const Glow = ({ x, y, c, s }: { x: string; y: string; c: string; s: string }) => (
  <div className="dj-glow" style={{ left: x, top: y, width: s, height: s, background: `radial-gradient(circle, ${c} 0%, ${c}55 30%, transparent 68%)` }} />
)
const circle = (cx: number, cy: number, r: number) => `M${(cx - r).toFixed(0)} ${cy.toFixed(0)}a${r.toFixed(0)} ${r.toFixed(0)} 0 1 0 ${(2 * r).toFixed(0)} 0a${r.toFixed(0)} ${r.toFixed(0)} 0 1 0 ${(-2 * r).toFixed(0)} 0Z`

/** A row of round-crowned broadleaf trees (sal, silver oak) on a rolling ground line. */
function forest(seed: number, base: number, minH: number, maxH: number, gap: number) {
  const r = rng(seed)
  let d = ''
  for (let x = -30; x < 1650; x += 30 + r() * gap) {
    const h = minH + r() * (maxH - minH)
    const y0 = base + Math.sin(x / 150) * 10
    const cr = h * (0.22 + r() * 0.08)
    d += `M${x - 3} ${y0 + 40}L${x - 3} ${y0 - h * 0.5}L${x + 3} ${y0 - h * 0.5}L${x + 3} ${y0 + 40}Z`
    for (let k = 0; k < 4; k++) d += circle(x + (r() - 0.5) * cr * 1.4, y0 - h + cr + r() * cr * 0.9, cr * (0.6 + r() * 0.45))
  }
  return d + `M-40 ${base + 6} Q400 ${base - 8} 800 ${base + 4} T1640 ${base} L1640 1000 L-40 1000 Z`
}

/** A coconut palm: a curved tapering trunk and drooping fronds. */
function palm(seed: number, x: number, base: number, h: number, lean: number) {
  const r = rng(seed)
  const tx = x + h * lean
  const ty = base - h
  const mx = x + h * lean * 0.15
  let d = `M${x - 13} ${base + 60}Q${mx - 9} ${base - h * 0.55} ${tx - 5} ${ty}L${tx + 5} ${ty}Q${mx + 9} ${base - h * 0.55} ${x + 13} ${base + 60}Z`
  for (const a of [-172, -145, -118, -92, -64, -36, -8, 14, 196]) {
    const rad = ((a + (r() - 0.5) * 14) * Math.PI) / 180
    const len = h * (0.34 + r() * 0.12)
    const ex = tx + Math.cos(rad) * len
    const ey = ty + Math.sin(rad) * len + len * 0.42 // droop
    const cx = (tx + ex) / 2
    const cy = (ty + ey) / 2 - len * 0.32
    const w = len * 0.13
    d += `M${tx} ${ty}Q${cx} ${cy - w} ${ex.toFixed(0)} ${ey.toFixed(0)}Q${cx} ${cy + w} ${tx} ${ty}Z`
  }
  return d + circle(tx, ty + 4, 9)
}

/** Sine wave lines twice the scene width, so sliding them one wavelength loops seamlessly. */
function waves(ys: number[], amp: number, len = 160) {
  return ys.map((y, i) => {
    let d = `M-200 ${y}`
    for (let x = -200; x < 3400; x += len) d += ` q${len / 4} ${-amp * (1 + i * 0.3)} ${len / 2} 0 t${len / 2} 0`
    return d
  }).join(' ')
}

/** Shimmering sun path on the water: short horizontal strokes, widening toward the viewer. */
function glint(cx: number, top: number, bottom: number) {
  const r = rng(cx)
  let d = ''
  for (let y = top; y < bottom; y += 7 + (y - top) * 0.06) {
    const w = 18 + (y - top) * 0.5 * (0.5 + r())
    d += `M${(cx - w / 2 + (r() - 0.5) * 20).toFixed(0)} ${y.toFixed(0)}h${w.toFixed(0)}`
  }
  return d
}

function Flakes({ seed }: { seed: number }) {
  const r = rng(seed)
  return (
    <div className="dj-fx">
      {Array.from({ length: 46 }, (_, i) => (
        <span key={i} className={'dj-flake' + (i % 2 ? ' dj-wide' : '')} style={css({
          left: `${r() * 100}%`, '--s': `${2 + r() * 4}px`, '--dur': `${7 + r() * 9}s`, '--delay': `${-r() * 16}s`, '--sway': `${20 + r() * 50}px`, opacity: 0.5 + r() * 0.5,
        })} />
      ))}
    </div>
  )
}

function Birds({ seed, n, colour, top = 18 }: { seed: number; n: number; colour: string; top?: number }) {
  const r = rng(seed)
  return (
    <div className="dj-fx">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="dj-bird" style={css({ top: `${top + r() * 22}%`, '--dur': `${18 + r() * 14}s`, '--delay': `${-r() * 30}s`, '--flap': `${0.5 + r() * 0.4}s` })}>
          <svg viewBox="0 0 24 10" width={14 + r() * 12} focusable="false"><path d="M1 6 Q6 0 12 6 Q18 0 23 6" fill="none" stroke={colour} strokeWidth="1.8" strokeLinecap="round" /></svg>
        </span>
      ))}
    </div>
  )
}

const Mist = ({ cls, c = 'rgba(255,255,255,.55)' }: { cls: string; c?: string }) => (
  <div className={'dj-mist ' + cls} style={{ background: `radial-gradient(ellipse at center, ${c}, transparent 70%)` }} />
)

/* ---------- the five landscapes ---------- */

function Snow({ id, seed }: { id: string; seed: number }) {
  // prayer flags hanging on a sagging string
  const flags: ReactNode[] = []
  const FC = ['#2F6FD1', '#F4F4F4', '#D2342C', '#2E9E52', '#F2C230']
  for (let i = 0, t = 0.04; t < 0.98; i++, t += 0.05) {
    const x = (1 - t) ** 2 * 1040 + 2 * (1 - t) * t * 1300 + t * t * 1660
    const y = (1 - t) ** 2 * -10 + 2 * (1 - t) * t * 150 + t * t * 20
    flags.push(<path key={i} d={`M${x - 9} ${y}L${x + 9} ${y + 2}L${x + 8} ${y + 26}L${x - 10} ${y + 24}Z`} fill={FC[i % 5]} className="dj-flag" style={css({ '--fd': `${(i % 7) * -0.4}s` })} />)
  }
  return (
    <>
      <Sky g="linear-gradient(180deg,#18214B 0%,#2F4A88 26%,#7298CC 50%,#DCC6C2 70%,#F3DFD0 100%)" />
      <Glow x="74%" y="30%" c="#FFE6C4" s="46vmin" />
      <L d={25}><path d={ridge(seed + 1, [[-40, 330], [260, 270], [520, 300], [800, 250], [1080, 280], [1340, 230], [1640, 280]], 80)} fill="#A3B4D8" opacity=".75" /></L>
      <L d={55}>
        <defs>
          <linearGradient id={id + 'pk'} x1="0" y1="40" x2="0" y2="470" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" /><stop offset=".3" stopColor="#F6E8EA" /><stop offset=".42" stopColor="#B9C3DF" />
            <stop offset=".52" stopColor="#7783AC" /><stop offset="1" stopColor="#384370" />
          </linearGradient>
          <linearGradient id={id + 'sh'} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#27305A" stopOpacity="0" /><stop offset=".5" stopColor="#27305A" stopOpacity=".32" /><stop offset="1" stopColor="#27305A" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={ridge(seed + 2, [[-40, 430], [200, 330], [420, 260], [600, 300], [760, 190], [880, 90], [960, 40], [1040, 130], [1160, 230], [1300, 160], [1420, 250], [1640, 330]], 50)} fill={`url(#${id}pk)`} />
        <path d={ridge(seed + 3, [[962, 44], [1010, 140], [1080, 250], [1170, 330], [1200, 1000], [962, 1000]], 30, 5, false)} fill={`url(#${id}sh)`} />
      </L>
      <Mist cls="dj-m1" />
      <L d={100}><path d={ridge(seed + 4, [[-40, 460], [240, 405], [520, 440], [800, 390], [1060, 430], [1320, 395], [1640, 430]], 50)} fill="#2E3A66" /></L>
      <Mist cls="dj-m2" c="rgba(220,230,250,.5)" />
      <L d={150}><path d={pines(seed + 5, 525, 46, 96, 34)} fill="#1D2748" /></L>
      <L d={230}>
        <defs>
          <linearGradient id={id + 'gr'} x1="0" y1="500" x2="0" y2="620" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F7F9FF" /><stop offset="1" stopColor="#BFCCEA" />
          </linearGradient>
        </defs>
        <path d={ridge(seed + 6, [[-40, 560], [320, 520], [700, 556], [1100, 512], [1640, 552]], 30)} fill={`url(#${id}gr)`} />
        <path d={ridge(seed + 7, [[-40, 585], [500, 570], [1000, 590], [1640, 572]], 20)} fill="#D6DFF3" opacity=".8" />
        <path d="M1040 -10 Q1300 150 1660 20" fill="none" stroke="#3B3550" strokeWidth="1.5" />
        {flags}
      </L>
      <Flakes seed={seed} />
    </>
  )
}

function Tea({ id, seed }: { id: string; seed: number }) {
  // a hill clipped with curved rows of tea bushes that widen toward the viewer
  const hill = (k: number, d: number, pts: [number, number][], fill: string, row: string, top: number) => {
    const p = ridge(seed + k, pts, 36)
    let rows = ''
    for (let y = top, step = 13; y < 1000; y += step, step *= 1.07) rows += `M-40 ${y.toFixed(0)} Q400 ${(y - 18).toFixed(0)} 800 ${y.toFixed(0)} T1640 ${y.toFixed(0)} `
    return (
      <L d={d}>
        <defs><clipPath id={`${id}c${k}`}><path d={p} /></clipPath></defs>
        <path d={p} fill={fill} />
        <path d={rows} clipPath={`url(#${id}c${k})`} fill="none" stroke={row} strokeWidth={4 + k} strokeDasharray={`${8 + k * 2} ${4 + k}`} strokeLinecap="round" />
      </L>
    )
  }
  return (
    <>
      <Sky g="linear-gradient(180deg,#9EC3E0 0%,#C8DEEA 36%,#E9EFE5 60%,#F5F1DC 100%)" />
      <Glow x="68%" y="22%" c="#FFF6D8" s="40vmin" />
      <L d={20}>
        <defs>
          <linearGradient id={id + 'k'} x1="0" y1="110" x2="0" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" /><stop offset=".5" stopColor="#E3EAF3" /><stop offset="1" stopColor="#A9BDD3" />
          </linearGradient>
        </defs>
        <path d={ridge(seed + 1, [[-40, 330], [500, 290], [760, 220], [920, 120], [1010, 170], [1120, 140], [1260, 240], [1640, 300]], 40)} fill={`url(#${id}k)`} opacity=".8" />
      </L>
      <Mist cls="dj-m1" c="rgba(255,255,255,.75)" />
      {hill(2, 60, [[-40, 370], [300, 330], [700, 360], [1100, 320], [1640, 350]], '#8DB394', '#7AA383', 330)}
      <Mist cls="dj-m2" c="rgba(255,255,255,.6)" />
      {hill(3, 110, [[-40, 420], [400, 400], [800, 440], [1200, 395], [1640, 425]], '#5F9A6D', '#4E8A5D', 395)}
      {hill(4, 170, [[-40, 490], [350, 470], [800, 500], [1250, 460], [1640, 485]], '#407D52', '#336C45', 460)}
      <L d={170}><path d={forest(seed + 8, 468, 60, 95, 420).replace(/M-40 \d+ Q.*$/, '')} fill="#3A6B4A" opacity=".85" /></L>
      {hill(5, 250, [[-40, 560], [500, 540], [1000, 565], [1640, 545]], '#2C6440', '#22553A', 545)}
      <div className="dj-fx"><span className="dj-cloud dj-c1" /><span className="dj-cloud dj-c2" /><span className="dj-cloud dj-c3" /></div>
      <Birds seed={seed} n={4} colour="#2E4A3A" />
    </>
  )
}

function Plateau({ id, seed }: { id: string; seed: number }) {
  return (
    <>
      <Sky g="linear-gradient(180deg,#2A1A4C 0%,#682D5E 24%,#BF4F5B 44%,#EE8848 58%,#F8BF66 68%,#F9D7A0 100%)" />
      <L d={15}>
        <defs>
          <radialGradient id={id + 's'}><stop offset="0" stopColor="#FFF4C8" /><stop offset=".7" stopColor="#FFD27A" /><stop offset="1" stopColor="#FFB45A" /></radialGradient>
        </defs>
        <circle cx="980" cy="330" r="190" fill="#FFD27A" opacity=".18" />
        <circle cx="980" cy="330" r="84" fill={`url(#${id}s)`} />
      </L>
      <L d={40}><path d={ridge(seed + 1, [[-40, 380], [120, 378], [170, 300], [480, 296], [530, 375], [760, 372], [800, 320], [1180, 314], [1230, 378], [1640, 372]], 14, 4)} fill="#8A4568" opacity=".85" /></L>
      <Mist cls="dj-m1" c="rgba(255,190,150,.45)" />
      <L d={90}><path d={ridge(seed + 2, [[-40, 440], [260, 436], [300, 360], [640, 352], [690, 430], [1000, 426], [1060, 380], [1400, 372], [1440, 430], [1640, 426]], 14, 4)} fill="#5A2C50" /></L>
      <L d={150}><path d={forest(seed + 3, 500, 60, 110, 50)} fill="#3A1D3C" /></L>
      <L d={240}><path d={forest(seed + 4, 590, 120, 220, 110)} fill="#22112A" /></L>
      <Birds seed={seed} n={7} colour="#2A1530" top={20} />
    </>
  )
}

function Coast({ id, seed }: { id: string; seed: number }) {
  const r = rng(seed)
  let town = ''
  for (let x = -40; x < 1090; x += 14 + r() * 26) if (x < 800 || x > 1020) town += `M${x.toFixed(0)} 372v${-(5 + r() * 20).toFixed(0)}h${(10 + r() * 16).toFixed(0)}V372Z`
  return (
    <>
      <Sky g="linear-gradient(180deg,#4D96CA 0%,#86BBDF 30%,#CDE2EB 50%,#F7DCAF 60%,#FBE6C4 100%)" />
      <L d={15}>
        <circle cx="1240" cy="352" r="120" fill="#FFF0C8" opacity=".35" />
        <circle cx="1240" cy="352" r="44" fill="#FFF3D6" />
        <path d={town + 'M-40 372 L-40 362 Q500 356 1090 364 L1110 372Z'} fill="#7D8BA3" />
        {/* Jagannath-style rekha deul with its flag, and the stepped hall in front */}
        <g transform="translate(905 372) scale(.62) translate(-905 -372)">
        <path d="M860 372L862 300C864 250 874 214 886 196L904 196C916 214 926 250 928 300L930 372Z M889 188L901 188L898 172L892 172Z M894 172h2v-26h-2Z M896 146l22 7l-22 7Z M930 372L930 330L938 330L946 312L954 312L962 296L978 296L986 312L994 312L1002 330L1010 330L1010 372Z M800 372L802 336C805 318 812 308 818 304L826 304C832 308 839 318 842 336L844 372Z" fill="#5B6985" />
        <ellipse cx="895" cy="192" rx="16" ry="6" fill="#5B6985" />
        </g>
      </L>
      <L d={35}>
        <defs>
          <linearGradient id={id + 'sea'} x1="0" y1="370" x2="0" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#9CCBDB" /><stop offset=".4" stopColor="#4C93B3" /><stop offset="1" stopColor="#1E5E84" />
          </linearGradient>
        </defs>
        <rect x="-40" y="371" width="1680" height="630" fill={`url(#${id}sea)`} />
        <path d={glint(1240, 376, 520)} stroke="#FFF2CF" strokeWidth="3" strokeLinecap="round" className="dj-glint" />
        <g className="dj-wave"><path d={waves([400, 440, 490], 4)} fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" /></g>
      </L>
      <L d={130}>
        <defs>
          <linearGradient id={id + 'sd'} x1="0" y1="490" x2="0" y2="620" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F3DCAE" /><stop offset="1" stopColor="#D2AE78" />
          </linearGradient>
        </defs>
        <path d="M-40 512 Q400 482 800 504 T1640 494 L1640 1000 L-40 1000Z" fill={`url(#${id}sd)`} />
        <path d="M-40 512 Q400 482 800 504 T1640 494" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" className="dj-foam" />
      </L>
      <L d={200}>
        {/* fishing boats pulled up on the sand */}
        <path d="M980 566q70 34 170 0l-14-22h-142z M1060 544v-70l4 0v70z" fill="#8C3B2C" />
        <path d="M1210 590q60 28 150 0l-12-20h-126z" fill="#2F5C7A" />
        <path d="M640 600q50 22 120 0l-10-16h-100z" fill="#A9622F" />
      </L>
      <Birds seed={seed} n={6} colour="#36465E" top={16} />
    </>
  )
}

function Beach({ id, seed }: { id: string; seed: number }) {
  return (
    <>
      <Sky g="linear-gradient(180deg,#26185A 0%,#6A3A8E 20%,#CF577F 40%,#F48A58 53%,#FFC47C 60%,#FFC47C 100%)" />
      <L d={15}>
        <defs>
          <radialGradient id={id + 's'}><stop offset="0" stopColor="#FFF7D2" /><stop offset=".75" stopColor="#FFD37E" /><stop offset="1" stopColor="#FFAE5E" /></radialGradient>
        </defs>
        <circle cx="1000" cy="350" r="230" fill="#FFD48A" opacity=".2" />
        <circle cx="1000" cy="352" r="86" fill={`url(#${id}s)`} />
        {/* headland with a fort and lighthouse */}
        <path d="M240 362 Q300 330 380 326 L380 300 L392 300 L392 290 L404 290 L404 300 L470 300 L470 312 L520 312 Q600 330 680 362Z M424 290 L428 230 L440 230 L444 290Z M422 230 L446 230 L434 216Z" fill="#4E2556" />
      </L>
      <L d={35}>
        <defs>
          <linearGradient id={id + 'sea'} x1="0" y1="360" x2="0" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F0907A" /><stop offset=".35" stopColor="#9A4B82" /><stop offset="1" stopColor="#3B2465" />
          </linearGradient>
        </defs>
        <rect x="-40" y="360" width="1680" height="640" fill={`url(#${id}sea)`} />
        <path d={glint(1000, 366, 540)} stroke="#FFD99A" strokeWidth="3" strokeLinecap="round" className="dj-glint" />
        <g className="dj-wave"><path d={waves([392, 430, 476], 4)} fill="none" stroke="rgba(255,214,180,.4)" strokeWidth="2" /></g>
      </L>
      <L d={70}>
        <g className="dj-boat"><path d="M700 384 L770 384 L758 396 L712 396Z M734 382 L734 330 L762 378Z M731 382 L731 340 L708 378Z" fill="#3A1C4A" /></g>
      </L>
      <L d={130}>
        <defs>
          <linearGradient id={id + 'sd'} x1="0" y1="500" x2="0" y2="620" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E9A67C" /><stop offset="1" stopColor="#A9625C" />
          </linearGradient>
        </defs>
        <path d="M-40 528 Q400 496 800 516 T1640 506 L1640 1000 L-40 1000Z" fill={`url(#${id}sd)`} />
        <path d="M-40 528 Q400 496 800 516 T1640 506" fill="none" stroke="#FFE7D2" strokeWidth="5" strokeLinecap="round" className="dj-foam" />
      </L>
      <L d={220} cls="dj-sway">
        <path d={palm(seed + 1, 1250, 620, 440, 0.22)} fill="#26112F" />
        <path d={palm(seed + 2, 1400, 640, 360, -0.12)} fill="#26112F" style={{ animationDelay: '-3s' }} />
        <path d={palm(seed + 3, 300, 630, 410, -0.26)} fill="#26112F" style={{ animationDelay: '-5s' }} />
      </L>
      <Birds seed={seed} n={6} colour="#3A1A45" top={14} />
    </>
  )
}

const SCENES: Record<Biome, (p: { id: string; seed: number }) => ReactNode> = { snow: Snow, tea: Tea, plateau: Plateau, coast: Coast, beach: Beach }

const Scenes = memo(function Scenes({ stops }: { stops: JourneyStop[] }) {
  return stops.map((s, i) => {
    const Scene = SCENES[biomeOf(s)]
    return (
      <div key={s.slug} className="dj-scene" style={{ opacity: i === 0 ? 1 : 0 }} aria-hidden="true">
        <Scene id={'dj' + i} seed={seedOf(s.slug)} />
        {/* real trip photos as pinned polaroids, drifting at their own depths with the scene */}
        {s.photos.length > 0 && (
          <div className="dj-photos">
            {s.photos.map((ph, k) => (
              <figure key={ph.src} className={'dj-ph dj-ph' + k} style={css({ '--d': 120 + k * 80 })}>
                <div className="dj-ph-card" style={css({ '--fd': `${-k * 2.2}s` })}>
                  <span className="dj-ph-img"><Image src={ph.src} alt="" fill sizes="(max-width:760px) 150px, 280px" style={{ objectFit: 'cover' }} /></span>
                  <figcaption>{ph.caption}</figcaption>
                </div>
              </figure>
            ))}
          </div>
        )}
      </div>
    )
  })
})

/* ---------- the section ---------- */

export function DestinationJourney({ stops }: { stops: JourneyStop[] }) {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const n = stops.length

  useEffect(() => {
    const el = root.current
    if (!el) return
    const scenes = [...el.querySelectorAll<HTMLElement>('.dj-scene')]
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let last = 0
    const update = () => {
      const span = el.offsetHeight - window.innerHeight
      const f = span > 0 ? Math.min(1, Math.max(0, -el.getBoundingClientRect().top / span)) : 0
      const x = f * (scenes.length - 1) // 0 → first place, n-1 → last place
      scenes.forEach((s, i) => {
        const p = i - x
        const d = Math.abs(p)
        const t = Math.min(1, Math.max(0, (d - 0.28) / 0.44)) // hold, then cross-fade
        const o = 1 - t * t * (3 - 2 * t)
        s.style.opacity = o.toFixed(3)
        s.style.visibility = o > 0 ? 'visible' : 'hidden'
        if (!still) s.style.setProperty('--p', p.toFixed(4))
      })
      el.style.setProperty('--f', f.toFixed(4))
      const a = Math.round(x)
      if (a !== last) setActive((last = a))
    }
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf) }
  }, [])

  if (!n) return null

  return (
    <section className="dj" id="destinations" ref={root} style={css({ '--n': n })} aria-labelledby="dj-h">
      {/* scroll targets for the rail links: one screen per place */}
      {stops.map((s, i) => <span key={s.slug} id={'dest-' + s.slug} className="dj-anchor" style={{ top: `${i * 100}svh` }} />)}
      {/* the header turns see-through only over the scene, not over the lavender mountain edges */}
      <span className="dj-clear" data-nav-clear />
      <svg className="dj-edge dj-edge-top" viewBox="0 0 1600 90" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={EDGE} /></svg>
      <svg className="dj-edge dj-edge-bot" viewBox="0 0 1600 90" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d={EDGE} /></svg>
      <div className="dj-stage">
        <Scenes stops={stops} />
        <div className="dj-shade" />
        <div className="dj-ui">
          <div className="dj-left">
            <div className="dj-cards">
              {stops.map((s, i) => (
                <article key={s.slug} className={'dj-card' + (i === active ? ' on' : '')} inert={i !== active} aria-hidden={i !== active}>
                  <span className="dj-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                  <p className="dj-k" style={css({ '--i': 0 })}><span className="dj-tag">{LABEL[biomeOf(s)]}</span>{s.area}</p>
                  <h3 className="dj-name" style={css({ '--i': 1 })}>{s.name}</h3>
                  <p className="dj-blurb" style={css({ '--i': 2 })}>{s.blurb}</p>
                  {s.places.length > 0 && (
                    <ul className="dj-places" style={css({ '--i': 3 })}>{s.places.map((p) => <li key={p}><Icon name="pin" size={13} />{p}</li>)}</ul>
                  )}
                  <dl className="dj-facts" style={css({ '--i': 4 })}>
                    <div><Icon name="calendar" size={18} /><dt>Duration</dt><dd>{s.nights} nights</dd></div>
                    {s.next && <div><Icon name="bus" size={18} /><dt>Next departure</dt><dd>{s.next}{s.from && <small> · {s.from}</small>}</dd></div>}
                    {s.price && <div><Icon name="wallet" size={18} /><dt>From</dt><dd>{s.price}</dd></div>}
                  </dl>
                  <div className="dj-ctas" style={css({ '--i': 5 })}>
                    <Link href={s.href} className="dj-cta">{s.cta} <Icon name="arrow" size={16} /></Link>
                    {s.href !== s.plan && <Link href={s.plan} className="dj-cta2">Plan it privately</Link>}
                  </div>
                </article>
              ))}
            </div>
          </div>
          <nav className="dj-rail" aria-label="Destinations">
            <span className="dj-track"><span /></span>
            {stops.map((s, i) => (
              <a key={s.slug} href={'#dest-' + s.slug} className={i === active ? 'on' : ''} aria-current={i === active ? 'true' : undefined}>
                <i>{String(i + 1).padStart(2, '0')}</i><span>{s.name}</span>
              </a>
            ))}
          </nav>
        </div>
        <p className={'dj-hint' + (active === 0 ? '' : ' off')} aria-hidden="true"><span />Scroll to travel</p>
      </div>
    </section>
  )
}
