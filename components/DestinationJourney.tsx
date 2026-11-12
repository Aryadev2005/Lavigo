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

type Biome = 'lake' | 'snow' | 'tea' | 'plateau' | 'coast' | 'beach'

// destinations come from the admin, so pick the landscape from the words that describe the place
function biomeOf(s: JourneyStop): Biome {
  const t = `${s.slug} ${s.name} ${s.area}`.toLowerCase()
  if (/nepal|pokhara|kathmandu|nainital|bhimtal|dal lake|pangong|lake/.test(t)) return 'lake'
  if (/sikkim|gangtok|lachung|ladakh|leh|manali|spiti|kashmir|himachal|shimla|kedar|uttarakhand|bhutan|tawang|auli|himalaya|snow/.test(t)) return 'snow'
  if (/darjeeling|munnar|ooty|coorg|assam|kalimpong|mirik|tea/.test(t)) return 'tea'
  if (/goa|andaman|gokarna|varkala|kovalam|lakshadweep|pondicherry|puducherry|maldives|beach/.test(t)) return 'beach'
  if (/puri|konark|chilika|rameswaram|kanyakumari|vizag|digha|dwarka|coast|temple/.test(t)) return 'coast'
  return 'plateau'
}

const LABEL: Record<Biome, string> = { lake: 'Lakes & peaks', snow: 'Snow & monasteries', tea: 'Tea gardens', plateau: 'Forests & waterfalls', coast: 'Temple coast', beach: 'Sun & sea' }

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

function Paragliders({ seed }: { seed: number }) {
  const r = rng(seed)
  const C = ['#E4572E', '#F3B61F', '#2E86C1', '#C2185B']
  return (
    <div className="dj-fx">
      {C.map((c, i) => (
        <span key={i} className="dj-glider" style={css({ top: `${10 + r() * 20}%`, '--dur': `${46 + r() * 30}s`, '--delay': `${-r() * 60}s` })}>
          <svg viewBox="0 0 40 34" width={26 + r() * 16} focusable="false">
            <path d="M2 10 Q20 -2 38 10 Q30 7 20 7 Q10 7 2 10Z" fill={c} />
            <path d="M4 10 L19 28 M36 10 L21 28 M12 8 L19 28 M28 8 L21 28" stroke="rgba(40,30,50,.5)" strokeWidth=".6" />
            <circle cx="20" cy="30" r="2.6" fill="#2A2433" />
          </svg>
        </span>
      ))}
    </div>
  )
}

function Motes({ seed }: { seed: number }) {
  const r = rng(seed)
  return (
    <div className="dj-fx">
      {Array.from({ length: 26 }, (_, i) => (
        <span key={i} className={'dj-mote' + (i % 2 ? ' dj-wide' : '')} style={css({ left: `${r() * 100}%`, top: `${40 + r() * 55}%`, '--s': `${2 + r() * 3}px`, '--dur': `${8 + r() * 10}s`, '--delay': `${-r() * 18}s` })} />
      ))}
    </div>
  )
}

/** Pokhara: golden sunrise on Machhapuchhre, mirrored in Phewa Lake, with painted boats and paragliders. */
function Lake({ id, seed }: { id: string; seed: number }) {
  const peak = ridge(seed + 2, [[-40, 420], [300, 350], [520, 330], [700, 260], [820, 160], [880, 90], [905, 42], [922, 78], [944, 52], [990, 150], [1080, 250], [1220, 320], [1400, 300], [1640, 360]], 22, 5)
  const boat = (x: number, y: number, hull: string, roof: string | null, k: number) => (
    <g key={k} transform={`translate(${x} ${y})`}><g className="dj-bob" style={css({ '--fd': `${-k * 1.3}s` })}>
      {roof && <path d="M-20 -6 L-20 -22 Q0 -30 20 -22 L20 -6Z" fill={roof} />}
      <path d="M-42 -6 Q0 12 42 -6 L36 -1 Q0 10 -36 -1Z" fill={hull} />
      <path d="M-40 -6 L40 -6 L36 0 L-36 0Z" fill={hull} opacity=".85" />
      <path d="M-30 10 Q0 16 30 10" stroke="rgba(255,255,255,.25)" strokeWidth="2" fill="none" />
    </g></g>
  )
  return (
    <>
      <Sky g="linear-gradient(180deg,#34477F 0%,#7480B2 22%,#E3A68C 46%,#F6C88E 58%,#FBE3B8 100%)" />
      <Glow x="22%" y="44%" c="#FFE0A8" s="52vmin" />
      <L d={20}>
        <defs>
          <linearGradient id={id + 'far'} x1="0" y1="120" x2="0" y2="360" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFF4EC" /><stop offset=".5" stopColor="#F2CFC6" /><stop offset="1" stopColor="#B597AE" />
          </linearGradient>
        </defs>
        <path d={ridge(seed + 1, [[-40, 330], [200, 250], [380, 190], [520, 230], [640, 180], [760, 250], [1100, 200], [1260, 150], [1400, 210], [1640, 260]], 50)} fill={`url(#${id}far)`} opacity=".85" />
      </L>
      <L d={45}>
        <defs>
          <linearGradient id={id + 'pk'} x1="0" y1="40" x2="0" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFF9F0" /><stop offset=".3" stopColor="#F8D8C4" /><stop offset=".5" stopColor="#B48FA6" /><stop offset="1" stopColor="#4F4B78" />
          </linearGradient>
        </defs>
        <path d={peak} fill={`url(#${id}pk)`} />
      </L>
      <Mist cls="dj-m1" c="rgba(255,226,200,.55)" />
      <L d={85}>
        <path d={ridge(seed + 3, [[-40, 440], [260, 400], [520, 425], [720, 380], [900, 420], [1200, 395], [1640, 430]], 30)} fill="#3E5674" />
        {/* World Peace Pagoda on the ridge */}
        <path d="M698 384h44v-6h-44z M704 378h32v-8h-32z M708 370a12 12 0 0 1 24 0z M718 358h4v-14h-4z" fill="#F7F2EA" />
        <circle cx="720" cy="342" r="3" fill="#E8B04B" />
      </L>
      <L d={120}>
        <defs>
          <linearGradient id={id + 'lk'} x1="0" y1="440" x2="0" y2="620" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F2C8A2" /><stop offset=".4" stopColor="#8F9CC2" /><stop offset="1" stopColor="#3D5884" />
          </linearGradient>
          <clipPath id={id + 'lc'}><rect x="-40" y="441" width="1680" height="600" /></clipPath>
        </defs>
        <rect x="-40" y="440" width="1680" height="600" fill={`url(#${id}lk)`} />
        <g clipPath={`url(#${id}lc)`} opacity=".3"><path d={peak} transform="translate(0 880) scale(1 -1)" fill="#FFF3E6" /></g>
        <path d={glint(330, 446, 560)} stroke="#FFE7BF" strokeWidth="2.5" strokeLinecap="round" className="dj-glint" />
        <g className="dj-wave"><path d={waves([462, 492, 530], 2.5, 200)} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5" /></g>
      </L>
      <L d={170}>
        {boat(650, 505, '#C0392B', '#2E86C1', 0)}
        {boat(800, 545, '#2E86C1', null, 1)}
        {boat(1340, 520, '#E2A21B', '#C0392B', 2)}
        {boat(560, 580, '#1F8A5B', '#F3B61F', 3)}
      </L>
      <L d={250}>
        <defs><clipPath id={id + 'bk'}><path d="M-40 1000 L-40 470 Q160 480 330 600 L330 1000Z M1640 1000 L1640 480 Q1500 490 1380 610 L1380 1000Z" /></clipPath></defs>
        <g clipPath={`url(#${id}bk)`}><path d={forest(seed + 4, 560, 140, 230, 40)} fill="#1E2A3E" /></g>
      </L>
      <Paragliders seed={seed} />
      <Birds seed={seed} n={4} colour="#3A3550" top={30} />
    </>
  )
}

/** North Sikkim: icy blue dusk over a frozen high lake, a gompa on the ridge, yaks, prayer poles and snowfall. */
function Snow({ id, seed }: { id: string; seed: number }) {
  const yak = (x: number, y: number, s: number, k: number) => (
    <g key={k} transform={`translate(${x} ${y}) scale(${s})`} fill="#2B2638">
      <path d="M-34 -30 C-30 -44 -6 -48 14 -44 C30 -42 40 -36 42 -24 C44 -14 40 -8 36 -6 L36 0 L30 0 L29 -8 L14 -8 L12 0 L6 0 L5 -9 C-6 -9 -14 -8 -20 -9 L-21 0 L-27 0 L-28 -10 C-34 -12 -38 -16 -40 -22 L-48 -22 C-52 -22 -54 -26 -52 -30 C-50 -34 -44 -36 -38 -34 Z" />
      <path d="M-24 -10 L-20 -1 L-16 -10 L-10 -2 L-6 -10 L0 -1 L4 -10 L10 -2 L14 -9Z" />
      <path d="M-46 -33 C-54 -38 -52 -46 -44 -47 C-47 -42 -45 -38 -41 -35Z" fill="#E9E4DA" />
    </g>
  )
  const poles = [628, 660, 694].map((x, i) => (
    <g key={x}>
      <path d={`M${x} 640 L${x} ${330 + i * 22}`} stroke="#3A3448" strokeWidth="2.5" />
      <path d={`M${x + 1} ${340 + i * 22} L${x + 13} ${342 + i * 22} L${x + 12} ${540} L${x + 1} ${536}Z`} fill={i === 2 ? '#E9EEF7' : '#F7F9FF'} className="dj-darchor" style={css({ '--fd': `${-i * 0.6}s` })} />
    </g>
  ))
  return (
    <>
      <Sky g="linear-gradient(180deg,#0B1634 0%,#1C3670 30%,#4977B2 55%,#A3C6E3 76%,#DCEBF5 100%)" />
      <Glow x="70%" y="26%" c="#E6F1FF" s="40vmin" />
      <L d={25}><path d={ridge(seed + 1, [[-40, 330], [260, 270], [520, 300], [800, 250], [1080, 280], [1340, 230], [1640, 280]], 80)} fill="#8FAAD6" opacity=".7" /></L>
      <L d={55}>
        <defs>
          <linearGradient id={id + 'pk'} x1="0" y1="40" x2="0" y2="470" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" /><stop offset=".34" stopColor="#E3EEFA" /><stop offset=".5" stopColor="#8EA6D0" /><stop offset="1" stopColor="#2C3B6A" />
          </linearGradient>
        </defs>
        <path d={ridge(seed + 2, [[-40, 430], [200, 320], [420, 250], [600, 290], [760, 180], [880, 100], [960, 50], [1040, 140], [1160, 220], [1300, 150], [1420, 240], [1640, 320]], 50)} fill={`url(#${id}pk)`} />
      </L>
      <Mist cls="dj-m1" c="rgba(225,238,255,.5)" />
      <L d={95}>
        <path d={ridge(seed + 3, [[-40, 455], [300, 420], [620, 445], [760, 410], [900, 440], [1300, 415], [1640, 450]], 30)} fill="#E8F0FA" />
        <path d={ridge(seed + 4, [[-40, 470], [500, 455], [1000, 470], [1640, 458]], 20)} fill="#C5D5EC" opacity=".7" />
        {/* gompa: white walls, maroon band, tiered golden roofs */}
        <g transform="translate(760 414) scale(.7)">
          <path d="M-60 0 V-50 H60 V0Z" fill="#F2F1EE" /><path d="M-60 -50 H60 V-40 H-60Z" fill="#7E2626" />
          <path d="M-40 -24 h10 v14 h-10z M-5 -24 h10 v24 h-10z M30 -24 h10 v14 h-10z" fill="#3A2C3A" />
          <path d="M-74 -50 L74 -50 L52 -66 L-52 -66Z" fill="#C8902C" />
          <path d="M-34 -66 V-90 H34 V-66Z" fill="#F2F1EE" /><path d="M-34 -90 H34 V-82 H-34Z" fill="#7E2626" />
          <path d="M-46 -90 L46 -90 L26 -106 L-26 -106Z" fill="#D9A441" />
          <path d="M-4 -106 L-3 -122 L0 -130 L3 -122 L4 -106Z" fill="#E8B84F" />
        </g>
      </L>
      <L d={140}>
        <defs>
          <linearGradient id={id + 'ice'} x1="0" y1="480" x2="0" y2="580" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#E4F1FB" /><stop offset="1" stopColor="#8DB4DA" />
          </linearGradient>
        </defs>
        <path d="M-40 492 Q400 478 800 490 T1640 486 L1640 1000 L-40 1000Z" fill={`url(#${id}ice)`} />
        <path d="M300 520 l40 8 l30 -6 l50 12 M640 540 l60 -10 l40 14 l70 -4 M980 510 l50 10 l60 -8 M1180 548 l40 -6 l80 10" stroke="rgba(255,255,255,.75)" strokeWidth="1.5" fill="none" />
        <path d={glint(880, 494, 560)} stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" className="dj-glint" opacity=".6" />
      </L>
      <L d={230}>
        <defs>
          <linearGradient id={id + 'gr'} x1="0" y1="540" x2="0" y2="640" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F7FAFF" /><stop offset="1" stopColor="#B8C9E6" />
          </linearGradient>
        </defs>
        <path d={ridge(seed + 6, [[-40, 570], [320, 548], [700, 575], [1100, 545], [1640, 570]], 24)} fill={`url(#${id}gr)`} />
        {yak(640, 588, 1.1, 0)}{yak(740, 598, 0.9, 1)}{yak(1240, 592, 1, 2)}
        {poles}
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

/** Netarhat: golden afternoon on the plateau, a waterfall off a red laterite cliff, pine and sal forest. */
function Plateau({ id, seed }: { id: string; seed: number }) {
  return (
    <>
      <Sky g="linear-gradient(180deg,#5A8CA6 0%,#9BBFC3 28%,#E8D4A2 52%,#F2B877 66%,#F4C88E 100%)" />
      <Glow x="76%" y="30%" c="#FFE7B0" s="50vmin" />
      <L d={25}><path d={ridge(seed + 1, [[-40, 360], [140, 356], [190, 300], [520, 294], [570, 352], [1100, 346], [1150, 290], [1500, 284], [1550, 350], [1640, 348]], 12, 4)} fill="#7F9C95" opacity=".85" /></L>
      <Mist cls="dj-m1" c="rgba(255,236,200,.5)" />
      <L d={60}>
        <defs>
          <linearGradient id={id + 'cl'} x1="0" y1="300" x2="0" y2="520" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#B4673F" /><stop offset="1" stopColor="#6E3B28" />
          </linearGradient>
          <linearGradient id={id + 'wf'} x1="0" y1="300" x2="0" y2="490" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity=".95" /><stop offset="1" stopColor="#E8F4F6" stopOpacity=".8" />
          </linearGradient>
        </defs>
        {/* laterite cliff with a green cap and rock strata */}
        <path d={ridge(seed + 2, [[540, 1000], [556, 440], [590, 392], [640, 376], [760, 370], [850, 366], [960, 372], [1060, 368], [1110, 392], [1150, 450], [1170, 1000]], 12, 4, false)} fill={`url(#${id}cl)`} />
        <path d={ridge(seed + 6, [[586, 396], [640, 372], [760, 364], [850, 360], [960, 366], [1060, 362], [1114, 390], [1100, 400], [960, 384], [850, 378], [700, 384], [600, 404]], 8, 3, false)} fill="#4C7A3E" />
        <path d="M600 420 Q700 414 790 420 M900 418 Q1020 412 1120 424 M580 462 Q690 456 800 464 M900 460 Q1040 454 1140 466" stroke="rgba(60,25,15,.3)" strokeWidth="2.5" fill="none" />
        {/* two-tier waterfall off the lip of the cliff */}
        <path d="M842 372 Q848 366 862 366 L866 430 L870 500 L834 500 L838 430Z" fill={`url(#${id}wf)`} />
        <path d="M848 372 V500 M856 370 V500 M862 372 V500" stroke="rgba(160,200,212,.9)" strokeWidth="2" className="dj-fall" />
        <path d="M898 374 L906 374 L910 500 L894 500Z" fill={`url(#${id}wf)`} opacity=".8" />
        <path d="M902 376 V500" stroke="rgba(160,200,212,.9)" strokeWidth="1.6" className="dj-fall" />
        <ellipse cx="870" cy="494" rx="70" ry="18" fill="#FFFFFF" opacity=".7" style={{ filter: 'blur(7px)' }} />
      </L>
      <L d={110}><path d={pines(seed + 3, 500, 60, 120, 26)} fill="#2E5A3C" /></L>
      <L d={170}><path d={forest(seed + 4, 545, 80, 140, 40)} fill="#22442D" /></L>
      <L d={250}><path d={forest(seed + 5, 610, 150, 240, 120)} fill="#13281A" /></L>
      <Motes seed={seed} />
      <Birds seed={seed} n={5} colour="#2C3A2E" top={16} />
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

/** Goa: golden sunset over a turquoise sea, the fort on the headland, a beach shack with string lights, palms. */
function Beach({ id, seed }: { id: string; seed: number }) {
  // fairy lights along a sagging wire from the shack to a palm
  const bulbs: ReactNode[] = []
  for (let i = 0, t = 0.04; t < 1; i++, t += 0.075) {
    const x = (1 - t) ** 2 * 790 + 2 * (1 - t) * t * 960 + t * t * 1160
    const y = (1 - t) ** 2 * 452 + 2 * (1 - t) * t * 500 + t * t * 430
    bulbs.push(<circle key={i} cx={x} cy={y + 5} r="4" fill={['#FFE07A', '#FF9F6B', '#FFF3C2'][i % 3]} className="dj-bulb" style={css({ '--fd': `${-(i % 5) * 0.5}s` })} />)
  }
  return (
    <>
      <Sky g="linear-gradient(180deg,#1C4A78 0%,#4E86A8 20%,#F0A65E 45%,#FFC86A 55%,#FFE2A0 61%,#FFE2A0 100%)" />
      <L d={15}>
        <defs>
          <radialGradient id={id + 's'}><stop offset="0" stopColor="#FFFBE0" /><stop offset=".75" stopColor="#FFD86E" /><stop offset="1" stopColor="#FFB347" /></radialGradient>
        </defs>
        <circle cx="1000" cy="350" r="240" fill="#FFD27A" opacity=".22" />
        <circle cx="1000" cy="352" r="86" fill={`url(#${id}s)`} />
        {/* headland with Aguada-style fort and lighthouse */}
        <path d="M240 362 Q300 330 380 326 L380 300 L392 300 L392 290 L404 290 L404 300 L470 300 L470 312 L520 312 Q600 330 680 362Z M424 290 L428 230 L440 230 L444 290Z M422 230 L446 230 L434 216Z" fill="#2D4153" />
      </L>
      <L d={35}>
        <defs>
          <linearGradient id={id + 'sea'} x1="0" y1="360" x2="0" y2="600" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F6B46A" /><stop offset=".22" stopColor="#3FA3A0" /><stop offset=".6" stopColor="#1F7C86" /><stop offset="1" stopColor="#0F4A5C" />
          </linearGradient>
        </defs>
        <rect x="-40" y="360" width="1680" height="640" fill={`url(#${id}sea)`} />
        <path d={glint(1000, 366, 540)} stroke="#FFE29A" strokeWidth="3" strokeLinecap="round" className="dj-glint" />
        <g className="dj-wave"><path d={waves([392, 430, 476], 4)} fill="none" stroke="rgba(220,255,250,.35)" strokeWidth="2" /></g>
      </L>
      <L d={70}>
        <g className="dj-boat"><path d="M700 384 L770 384 L758 396 L712 396Z M734 382 L734 330 L762 378Z M731 382 L731 340 L708 378Z" fill="#23384A" /></g>
      </L>
      <L d={130}>
        <defs>
          <linearGradient id={id + 'sd'} x1="0" y1="500" x2="0" y2="620" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#F6D29A" /><stop offset="1" stopColor="#D49A5C" />
          </linearGradient>
        </defs>
        <path d="M-40 528 Q400 496 800 516 T1640 506 L1640 1000 L-40 1000Z" fill={`url(#${id}sd)`} />
        <path d="M-40 528 Q400 496 800 516 T1640 506" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" className="dj-foam" />
      </L>
      <L d={180}>
        {/* shack on stilts with a thatched roof */}
        <path d="M650 580 V490 M662 580 V490 M778 580 V490 M790 580 V490" stroke="#5B3A22" strokeWidth="6" />
        <path d="M642 500 H798 V520 H642Z" fill="#8A5A34" />
        <path d="M650 520 H790 V560 H650Z" fill="#6E4527" opacity=".55" />
        <path d="M620 496 L720 440 L820 496 Q720 486 620 496Z" fill="#7A5230" />
        <path d="M632 494 L720 446 L808 494" stroke="#A97A45" strokeWidth="2" fill="none" />
        <path d="M790 452 Q960 500 1160 430" stroke="#3A2A20" strokeWidth="1.2" fill="none" />
        {bulbs}
        {/* striped umbrella and two loungers */}
        <path d="M1300 600 L1310 470" stroke="#4A3528" strokeWidth="4" />
        <path d="M1240 486 Q1310 430 1380 462 Q1310 470 1240 486Z" fill="#E4572E" />
        <path d="M1272 470 Q1310 440 1330 452 Q1306 460 1290 476Z M1340 455 Q1360 456 1380 462 Q1360 462 1345 466Z" fill="#FFF3E0" />
        <path d="M1220 590 L1290 590 L1300 576 M1320 598 L1390 598 L1400 584" stroke="#F5EEE2" strokeWidth="5" strokeLinecap="round" fill="none" />
      </L>
      <L d={230} cls="dj-sway">
        <path d={palm(seed + 1, 1160, 620, 440, 0.2)} fill="#16262C" />
        <path d={palm(seed + 2, 1450, 640, 360, -0.12)} fill="#16262C" style={{ animationDelay: '-3s' }} />
        <path d={palm(seed + 3, 300, 630, 410, -0.26)} fill="#16262C" style={{ animationDelay: '-5s' }} />
      </L>
      <Birds seed={seed} n={6} colour="#1E3442" top={14} />
    </>
  )
}

const SCENES: Record<Biome, (p: { id: string; seed: number }) => ReactNode> = { lake: Lake, snow: Snow, tea: Tea, plateau: Plateau, coast: Coast, beach: Beach }

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
